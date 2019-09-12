# Example use of the Sin include, by ElderProphet
# This script just demonstrates how to setup and call an include.
# You need to know what to pass the include, what include :header to call,
#   and what will be returned.  Consult the include file for this info.

echo "*What is the angle, in degrees?"
getConsoleInput $angle
setVar $sin~x $angle
gosub :sin~Include
echo "*Sin(" $angle ")=" $sin~x "*"
halt

include "Include\Sin"