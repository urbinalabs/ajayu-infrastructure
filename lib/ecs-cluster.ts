import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';

export interface EcsClusterProps {
    readonly vpc: ec2.Vpc;
}

export class EcsCluster extends cdk.Stack {

    public readonly cluster: ecs.Cluster;

    constructor(scope: cdk.App, id: string, props: EcsClusterProps) {
        super(scope, id);

        this.cluster = new ecs.Cluster(this, 'Cluster', {
            vpc: props.vpc,
            containerInsights: true,
            enableFargateCapacityProviders: true
        });
    }
}
