#!/bin/bash
# 
#  link_production.sh
#  starusa-sgt
#  
#  Created by Carson S. Christian on 2012-09-29.
#  Copyright 2012 (ampl)EGO. All rights reserved.
# 

# create a new screen session to link the local port 5984 to fire.amplego.com:5984
ssh fire.amplego.com -L localhost:5984:localhost:5984