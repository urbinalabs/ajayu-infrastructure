import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SharedVpc } from './shared-vpc';
import { EcsCluster } from './ecs-cluster';
import { MetabaseService } from '../lib/metabase-service';

export class Metabase extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        cdk.Tags.of(this).add('urbinalabs:app', 'Metabase', {
            priority: 300
        });

        const sharedVpc = new SharedVpc(this, 'vpc');
        const ecsCluster = new EcsCluster(this, 'cluster', {
            vpc: sharedVpc.vpc
        });
        const service = new MetabaseService(this, 'service', {
            cluster: ecsCluster.cluster,
            vpc: sharedVpc.vpc
        });
    }
}
