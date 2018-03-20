#!/bin/bash
psql -U postgres -h localhost -f Wks3Create
node Wks2Js.js
