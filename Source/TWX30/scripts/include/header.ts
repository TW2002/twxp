:header~pack2header



























getlength $header~script $header~spaces
setvar $header~spaces ((20 - ($header~spaces / 2)) - 1)

echo "**" ANSI_15 "/-------TWX-PROXY-SCRIPT-PACK-2-------\*"
echo "             Version 2.00**"

while ($header~spaces > 0)
  echo " "
  subtract $header~spaces 1
end

echo $header~script "***"
echo ANSI_7 "For script information please refer to the*Pack2 Documentation.  Remember that you can*always use the help option (+) to get*information on any script feature."
echo "**" ANSI_15 "Read the warnings about this script before*using it!**"
return
