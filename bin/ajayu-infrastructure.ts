#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharedVpc } from '../lib/shared-vpc';
import { EcsCluster } from '../lib/ecs-cluster';
import { RdsCluster } from '../lib/rds-cluster';
import { MetabaseService } from '../lib/metabase-service';

const app = new cdk.App();

const sharedVpc = new SharedVpc(app, 'SharedVpc');

const ecsCluster = new EcsCluster(app, 'EcsCluster', {
  vpc: sharedVpc.vpc
});

const rdsCluster = new RdsCluster(app, 'RdsCluster', {
  vpc: sharedVpc.vpc
});

const metabaseService = new MetabaseService(app, 'MetabaseService', {
  cluster: ecsCluster.cluster,
  vpc: sharedVpc.vpc
});
