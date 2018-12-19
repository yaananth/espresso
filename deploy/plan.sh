#!/bin/bash -e
. bashfunctions.sh

terraform init -backend-config=/temp/backend.conf -input=false
terraform --version
for workspace in $(terraform workspace list | sed 's/. //' | grep -v -e "default" -e "^$")
do
  echo "plan $workspace"
  TF_WORKSPACE=$workspace terraform plan -input=false -no-color
done
