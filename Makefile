# Atajos desde la raíz del repo → backend/Makefile (mismas variables: TAG_SHA, AWS_REGION, …)
.PHONY: lambda-deploy lambda-deploy-ci lambda-build-all lambda-ecr-login

lambda-deploy:
	$(MAKE) -C backend lambda-deploy

lambda-deploy-ci:
	$(MAKE) -C backend lambda-deploy-ci

lambda-build-all:
	$(MAKE) -C backend lambda-build-all

lambda-ecr-login:
	$(MAKE) -C backend lambda-ecr-login
