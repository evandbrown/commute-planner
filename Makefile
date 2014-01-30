
CSS = $(shell find client -name '*.css')
HTML = $(shell find client -name '*.html')
CLIENTJS = $(shell find client -name '*.js')
SERVERJS = $(shell find server -name '*.js')
TESTJS = $(shell find test -name '*.js')
JSON = $(shell find client -name '*.json')

REPORTER = spec

build: components $(CSS) $(HTML) $(JS) $(JSON)
	@$(MAKE) lint-client
	@$(MAKE) test-client
	@./node_modules/.bin/component build --dev --verbose

beautify:
	@./node_modules/.bin/js-beautify --quiet --replace $(CLIENTJS) $(SERVERJS) $(TESTJS)

clean:
	@rm -rf build
	@rm -rf components

components: component.json $(JSON)
	@./node_modules/.bin/component install --dev --verbose

# Display Makefile
help:
	@cat Makefile

# Install
install: node_modules components
	@source .env

node_modules: package.json
	@npm install

# Lint JavaScript with JSHint
lint:
	@./node_modules/.bin/jshint $(CLIENTJS) $(SERVERJS) $(TESTJS)
lint-client:
	@./node_modules/.bin/jshint $(CLIENTJS)
lint-server:
	@./node_modules/.bin/jshint $(SERVERJS)
lint-test:
	@./node_modules/.bin/jshint $(TESTJS)

# Run before each commit/release
release: beautify lint test
	@./node_modules/.bin/component build --verbose

# Watch & reload server
serve:
	@./node_modules/.bin/nodemon index.js --watch server --verbose

test: test-client test-server
test-client: lint-client lint-test
test-server: lint-server lint-test
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --require should --reporter $(REPORTER) --timeout 5000 --slow 10

watch:
	@watch $(MAKE) build

.PHONY: beautify help lint lint-client lint-server release test test-client test-server watch
