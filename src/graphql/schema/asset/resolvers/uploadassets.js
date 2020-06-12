const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');
const AWS = require('aws-sdk');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const {aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const errorHandler = new ErrorHandler();

const s3 = new AWS.S3();

module.exports = async (root, { file }, { user, dataSources: { repository } }) => {
	const { stream, mimetype} = await file;
	const size = 100;
	console.log(await file);
	const validator = new Validator({mimetype,size}, {
	    mimetype: 'required',
	    size:'required'
	  });
	validator.addPostRule(async (input) => {
	    if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
	      validator.addError('mimetype', 'custom', 'API does not support this mimetype');
	    }
	});

	return validator.check()
	    .then((matched) => {
	      if (!matched) {
	        throw errorHandler.build(validator.errors);
	      }
	      const { ext, type } = MIMEAssetTypes.detect(mimetype);
	      const id = uuid();
	      const path = `${user.id}/${id}.${ext}`;

	       return Promise.all([
	          s3.upload({
	            Bucket: aws.user_bucket,
	            Key: path,
	            Body: stream,
	          }).promise(),
	          repository.asset
	        	.create({
		           	_id: id,
			        owner: user,
			        path,
			        url: `${cdn.userAssets}/${path}`,
			        type,
			        size,
			        mimetype,
	          })])
	      .then(([, asset]) => asset)
	      .catch((error) => {
	        throw new Error(error);
	      });
	      
    });
}