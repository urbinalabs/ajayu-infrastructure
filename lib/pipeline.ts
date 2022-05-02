import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { SharedVpc } from './shared-vpc';
import { EcsCluster } from './ecs-cluster';
import { MetabaseService } from '../lib/metabase-service';

export class Pipeline extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new CodePipeline(this, 'Pipeline', {
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub('urbinalabs/ajayu-infrastructure', 'main'),
                commands: ['npm ci', 'npm run build', 'npx cdk synth']
            })
        });

        pipeline.addStage(new Metabase(this, 'Prod'));
    }
}

class Metabase extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        cdk.Tags.of(this).add('urbinalabs:app', 'Metabase', {
            priority: 300
        });

        const sharedVpc = new SharedVpc(this, 'SharedVpc');
        const ecsCluster = new EcsCluster(this, 'EcsCluster', {
            vpc: sharedVpc.vpc
        });
        const service = new MetabaseService(this, 'Metabase', {
            cluster: ecsCluster.cluster,
            vpc: sharedVpc.vpc
        });
    }
}
