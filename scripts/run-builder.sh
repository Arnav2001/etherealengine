#!/bin/bash
set -e
set -x

until [ -f /var/lib/docker/certs/client/ca.pem ]
do
  echo "Waiting for /var/lib/docker/certs/client/ca.pem to be available from dind volume"
  sleep 1
done
START_TIME=`date +"%d-%m-%yT%H-%M-%S"`
mkdir -pv ~/.docker
cp -v /var/lib/docker/certs/client/* ~/.docker
touch ./builder-started.txt
bash ./scripts/setup_helm.sh
bash ./scripts/setup_aws.sh $AWS_ACCESS_KEY $AWS_SECRET $AWS_REGION $CLUSTER_NAME
npm run check-db-exists
npm run prepare-database
npm run create-build-status
BUILDER_RUN=$(tail -1 builder-run.txt)
npm run install-projects >project-install-build-logs.txt 2>project-install-build-error.txt || npm run record-build-error -- --service=project-install
test -s project-install-build-error.txt && npm run record-build-error -- --service=project-install
npm run create-root-package-json
mv package.json package.jsonmoved
mv package-root-build.json package.json
npm install
rm package.json
mv package.jsonmoved package.json
npm run prepare-database >prepare-database-build-logs.txt 2>prepare-database-build-error.txt || npm run record-build-error -- --service=prepare-database
test -s prepare-database-build-error.txt && npm run record-build-error -- --service=prepare-database
cd packages/client && npm run buildenv >buildenv-build-logs.txt 2>buildenv-build-error.txt || npm run record-build-error -- --service=buildenv
test -s buildenv-build-error.txt && npm run record-build-error -- --service=buildenv
if [ -n "$TWA_LINK" ]
then
  npm run populate-assetlinks >populate-assetlinks-build-logs.txt >populate-assetlinks-build-logs.txt 2>populate-assetlinks-build-error.txt || npm run record-build-error -- --service=populate-assetlinks
test -s populate-assetlinks-build-error.txt && npm run record-build-error -- --service=populate-assetlinks
fi
cd ../..
bash ./scripts/cleanup_builder.sh $DOCKER_LABEL


if [ $PRIVATE_ECR == "true" ]
then
  aws ecr get-login-password --region $AWS_REGION | docker login -u AWS --password-stdin $ECR_URL
else
  aws ecr-public get-login-password --region us-east-1 | docker login -u AWS --password-stdin $ECR_URL
fi

mkdir -p ./project-package-jsons/projects/default-project
cp packages/projects/default-project/package.json ./project-package-jsons/projects/default-project
find packages/projects/projects/ -name package.json -exec bash -c 'mkdir -p ./project-package-jsons/$(dirname $1) && cp $1 ./project-package-jsons/$(dirname $1)' - '{}' \;

bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL root root $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >root-build-logs.txt 2>root-build-error.txt
npm run record-build-error -- --service=root --isDocker=true

npm install -g cli @aws-sdk/client-s3

if [ "$SERVE_CLIENT_FROM_STORAGE_PROVIDER" = "true" ] && [ "$STORAGE_PROVIDER" = "aws" ] ; then npm run list-client-s3-files-to-delete ; fi

if [ "$SERVE_CLIENT_FROM_API" = "true" ]
then
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL api api-client $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >api-build-logs.txt 2>api-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL instanceserver instanceserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >instanceserver-build-logs.txt 2>instanceserver-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL taskserver taskserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >taskserver-build-logs.txt 2>taskserver-build-error.txt &
  #bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL testbot testbot $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >testbot-build-logs.txt 2>testbot-build-error.txt && &

  wait < <(jobs -p)

  npm run record-build-error -- --service=api --isDocker=true
  npm run record-build-error -- --service=instanceserver --isDocker=true
  npm run record-build-error -- --service=taskserver --isDocker=true
  #npm run record-build-error -- --service=testbot --isDocker=true
else
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL api api $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >api-build-logs.txt 2>api-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL client client $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >client-build-logs.txt 2>client-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL instanceserver instanceserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >instanceserver-build-logs.txt 2>instanceserver-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL taskserver taskserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >taskserver-build-logs.txt 2>taskserver-build-error.txt &
  #bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL testbot testbot $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >testbot-build-logs.txt 2>testbot-build-error.txt && &

  wait < <(jobs -p)

  npm run record-build-error -- --service=api --isDocker=true
  npm run record-build-error -- --service=client --isDocker=true
  npm run record-build-error -- --service=instanceserver --isDocker=true
  npm run record-build-error -- --service=taskserver --isDocker=true
  #npm run record-build-error -- --service=testbot --isDocker=true
fi

bash ./scripts/deploy.sh $RELEASE_NAME ${TAG}__${START_TIME}

npm run updateCronjobImage -- --repoName=${REPO_NAME} --tag=${TAG} --ecrUrl=${ECR_URL} --startTime=${START_TIME}

npm run clear-projects-rebuild
npm run record-build-success
DEPLOY_TIME=`date +"%d-%m-%yT%H-%M-%S"`

bash ./scripts/cleanup_builder.sh $DOCKER_LABEL

END_TIME=`date +"%d-%m-%yT%H-%M-%S"`
echo "Started build at $START_TIME, deployed image to K8s at $DEPLOY_TIME, ended at $END_TIME"
sleep 5m
if [ "$SERVE_CLIENT_FROM_STORAGE_PROVIDER" = "true" ] && [ "$STORAGE_PROVIDER" = "aws" ] ; then
  npm run delete-old-s3-files;
  echo "Deleted old client files from S3"
fi

sleep infinity