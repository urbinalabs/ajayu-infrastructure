import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecsPatterns } from 'aws-cdk-lib';
import * as monitor from 'cdk-monitoring-constructs';

export interface MetabaseServiceProps {
    readonly cluster: ecs.Cluster;
    readonly vpc: ec2.Vpc;
}

export class MetabaseService extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MetabaseServiceProps) {
        super(scope, id);

        const db = new rds.DatabaseCluster(this, 'db', {
            engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
            parameterGroup: rds.ParameterGroup.fromParameterGroupName(
                this,
                'ParameterGroup',
                'default.aurora-postgresql13'
            ),
            instanceProps: {
                vpc: props.vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.ISOLATED
                },
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE4_GRAVITON,
                    ec2.InstanceSize.MEDIUM
                ),
                enablePerformanceInsights: true
            },
            defaultDatabaseName: 'metabase',
            credentials: rds.Credentials.fromUsername('metabase')
        });

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'Metabase', {
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        const dbSecret = db.node.tryFindChild('Secret') as rds.DatabaseSecret;

        const container = taskDefinition.addContainer('web', {
            image: ecs.ContainerImage.fromRegistry('metabase/metabase'),
            environment: {
                'MB_DB_TYPE': 'postgres'
            },
            secrets: {
                MB_DB_DBNAME: ecs.Secret.fromSecretsManager(dbSecret, 'dbname'),
                MB_DB_HOST: ecs.Secret.fromSecretsManager(dbSecret, 'host'),
                MB_DB_USER: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
                MB_DB_PASS: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
                MB_DB_PORT: ecs.Secret.fromSecretsManager(dbSecret, 'port'),
            },
            logging: new ecs.AwsLogDriver({
                streamPrefix: 'Metabase'
            })
        });

        container.addPortMappings({
            containerPort: 3000,
            hostPort: 3000,
            protocol: ecs.Protocol.TCP
        });

        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'fargateService', {
            cluster: props.cluster,
            desiredCount: 1,
            taskDefinition,
            assignPublicIp: true,
            taskSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });

        db.connections.allowDefaultPortFrom(fargateService.service);

        // Monitoring
        const monitoring = new monitor.MonitoringFacade(this, 'Monitoring', {
            metricFactoryDefaults: {
                namespace: 'Metabase'
            },
            alarmFactoryDefaults: {
                alarmNamePrefix: 'Metabase',
                actionsEnabled: true
            },
            dashboardFactory: new monitor.DefaultDashboardFactory(this, 'Dashboard', {
                dashboardNamePrefix: 'Metabase',
                createDashboard: true,
                createSummaryDashboard: false,
                createAlarmDashboard: false,
                renderingPreference: monitor.DashboardRenderingPreference.INTERACTIVE_ONLY
            })
        });

        monitoring.monitorFargateService({
            fargateService,
            humanReadableName: "Metabase",
            alarmFriendlyName: "Metabase"
        });

        monitoring.monitorRdsCluster({
            clusterIdentifier: db.clusterIdentifier,
            humanReadableName: "Database",
            alarmFriendlyName: "Database"
        });
    }
}
