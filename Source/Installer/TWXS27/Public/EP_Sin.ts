# Sin.ts, v1.0, by ElderProphet
# This script will determine the Sin(x), where x is a positve integer.
#
# This script can be called as an include, or run directly.
# To use as an include, I suggest putting it in the Include folder.
# Then in your calling script, add this line:
#   include "include\sin"
#
# For include use:
# Pass $sin~x
# Call :sin~Include
# Returns with $sin~x as the Result.

# If this script is launched conventionally (not as an include), start here.
:getInput
echo "*Enter the degrees:"
getConsoleInput $x
gosub :calculate
echo "*Sin(" $x ") = " $y "*"
halt

# If called as an include, set the value of $sin~x, then gosub :sin~include
:Include
gosub :calculate
setVar $x $y
# Will return from the include with $sin~x set as the Result.
return

:calculate
isNumber $yn $x
if ($yn = 0)
	echo ANSI_12 "*Input invalid for Sin() function.*Halting.*"
	halt
end
setPrecision 18

# Convert to Radians, as follows
#  x (in degrees) * 2 * PI / 360.
setVar $y $x
setVar $PI 3.141592653589793238
setVar $2PI (2 * $PI)
setVar $y (($y * $2PI) / 360)

# Reduce to a value between Pi and -Pi.
if ($y > 0)
	while ($y > $PI)
		subtract $y $2PI
	end
else
	while ($y < (0 - $PI))
		add $y $2PI
	end
end

# Now that y is in Radians, begin Taylor series.
# The following should yield enough accuracy, to roughly 5 decimal places.
#   sin(y) = y - y^3/3! + y^5/5! - y^7/7! + y^9/9! - y^11/11! + y^13/13! - y^15/15!

# Calculate the first 7 exponentials
setVar $y2 ($y * $y)
setVar $y3 ($y2 * $y)
setVar $y5 ($y2 * $y3)
setVar $y7 ($y2 * $y5)
setVar $y9 ($y2 * $y7)
setVar $y11 ($y2 * $y9)
setVar $y13 ($y2 * $y11)
setVar $y15 ($y2 * $y13)

# Calculate the first 7 factorials
setVar $3! (3 * 2)
setVar $5! ((5 * 4) * $3!)
setVar $7! ((7 * 6) * $5!)
setVar $9! ((9 * 8) * $7!)
setVar $11! ((11 * 10) * $9!)
setVar $13! ((13 * 12) * $11!)
setVar $15! ((15 * 14) * $13!)

# Complete the Taylor series calculations
setVar $y ((((((($y - ($y3/$3!)) + ($y5/$5!)) - ($y7/$7!)) + ($y9/$9!)) - ($y11/$11!)) + ($y13/$13!)) - ($y15/$15!))
round $y 6
return