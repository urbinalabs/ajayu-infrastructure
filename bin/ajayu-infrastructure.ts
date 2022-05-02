#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Metabase } from '../lib/metabase-stack';

// Pipeline
import { Pipeline } from '../lib/pipeline';

const app = new cdk.App();

// Metabase
const metabase = new Metabase(app, 'Metabase');

// Pipeline
new Pipeline(app, 'Pipeline', {
  env: {
    account: '460383082462',
    region: 'us-east-1'
  }
});
