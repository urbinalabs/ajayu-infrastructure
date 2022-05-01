import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecsPatterns } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';

export interface MetabaseServiceProps {
    readonly cluster: ecs.Cluster;
    readonly vpc: ec2.Vpc;
}

export class MetabaseService extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: MetabaseServiceProps) {
        super(scope, id);

        cdk.Tags.of(this).add('urbinalabs:app', 'Metabase');

        const database = new rds.DatabaseInstance(this, 'Database', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_14_2
            }),
            vpc: props.vpc,
            databaseName: 'metabase',
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE4_GRAVITON,
                ec2.InstanceSize.MICRO
            ),
            credentials: rds.Credentials.fromUsername('metabase'),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'Metabase', {
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        const dbSecret = database.node.tryFindChild('Secret') as rds.DatabaseSecret;

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
            desiredCount: 2,
            taskDefinition,
            assignPublicIp: true,
            taskSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });

        database.connections.allowDefaultPortFrom(fargateService.service);

        // const service = new ecs.FargateService(this, 'Service', {
        //     cluster: props.cluster,
        //     taskDefinition,
        //     assignPublicIp: true,
        //     enableECSManagedTags: true,
        //     enableExecuteCommand: true,
        //     vpcSubnets: {
        //         subnetType: ec2.SubnetType.PUBLIC
        //     }
        // });
    }
}
