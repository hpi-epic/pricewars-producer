#!/bin/bash

# This script will insert 4000 products (variable j) to the producer with four different qualities (variable i).
# Adjust the numbers or the producer endpoint s required and be patient - you won't see any succcess message 
# for successful insertions. Executing this scipt might is very inefficient and thus will run for about two minutes.

for j in `seq 1 4000`;
do
	for i in `seq 1 4`;
	do
		curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d "[{\"product_id\": $j,\"name\": \"CD_$j\",\"price\": 15.4, \"quality\": $i}]" 'http://vm-mpws2016hp1-03.eaalab.hpi.uni-potsdam.de/products'
	done;
done;
