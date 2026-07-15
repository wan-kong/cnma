IMAGE ?= __PROJECT_NAME__
VERSION ?= 0.0.1
PLATFORM ?= linux/amd64
ROOT_PREFIX ?=
API_MODE ?= mock
APP_TITLE ?= __PROJECT_NAME__

.PHONY: build push build-push


build:
	docker build --platform $(PLATFORM) --build-arg VITE_ROOT_PREFIX_URL=$(ROOT_PREFIX) --build-arg VITE_API_MODE=$(API_MODE) --build-arg VITE_GLOBAL_APP_TITLE="$(APP_TITLE)" -t $(IMAGE):$(VERSION) .

push:
	docker push $(IMAGE):$(VERSION)

build-push: build push
