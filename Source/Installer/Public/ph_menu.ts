#Parrots Menu fun
#text file containing masks
systemscript
setvar $file "menumask.txt"
#any name will do or store in array and call with subroutine

#example of text file below
#scripts\?ph*.cts        Parrot_Scipts
#scripts\?vid*.cts       Vid_scripts
#scripts\?ck*.cts        CK_public
#scripts\??ck*.cts       Ck_combat
#scripts\EP*.cts         ElderProphet_Scipts
#scripts\dny*.cts        Singularity_Scripts
#scripts\Ram*.cts       RammR_Scripts
#you get the idea

#ansi fun
setvar $ansistuff (ansi_7 & "-" & ansi_8 & "=" & ansi_15 & #42 & ansi_8 & "=" & ansi_7 & "-")
#set key codes here
gosub :keyvariables
#Lonestar's shift xx idea
#use any key you want(uppercase to avoid problems)
#:wait
#killalltriggers
#settextouttrigger one :one "X"
#pause
#:one
#killtrigger one
#settextouttrigger two :two "X"
#setdelaytrigger timeout :wait 2000
#pause
#:two
#killtrigger timeout
#check for file and do error stuff
#or we can add it to the main twx menu like this
setvar $menulabel "Super Deluxe Menu"
setvar $menuone (#27 & "[41;33m" & $menulabel & #27 & "[0m")
addMenu "TWX_MAIN" "Super Deluxe Menu" $menuone "M" ":start" "Menu" FALSE
:wait
pause
:start
fileExists $exists $file
if ($exists = 0)
Echo ansi_13 "*No mask file found!*"
halt
end
readtoarray $file $mask
if ($mask > 36)
Echo ansi_13 "*Too many selections - Max of 36 please!*"
halt
elseif ($mask = 0)
Echo ansi_13 "*File is empty!*"
end
#pick mask here
echo ansi_15 "**" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & " File Masks " & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "**"
setvar $k 1
while ($k <= $mask)
getword $mask[$k] $masklabel 2
echo ansi_12 #9 & $key[$k] & ")" & #9 & ansi_14 $masklabel & "*"
add $k 1
end
echo ansi_15 "*" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & " File Masks " & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "*"
#pick one
:choosemask
echo ansi_11 "*Choose a selection or Spacebar to cancel"
setvar $choosemask ""
getconsoleinput $choosemask singlekey
setvar $dupe $choosemask
if (($choosemask = "") or ($choosemask = 0) or ($choosemask = " "))
goto :wait
end
if ($mask >= 36)
setvar $temp 36
elseif ($mask > 0)
setvar $temp $mask
else
goto :wait
end
setvar $j 1
while ($j <= $temp)
if ($choosemask = $key[$j])
goto :0utmask
end
add $j 1
end
goto :choosemask
:0utmask
if ($choosemask = 0)
goto :wait
end
#get file names
getword $mask[$j] $mask0 1
getFileList $script $mask0
setvar $k 1
echo #27 & "[1A" & #27 & "[K"
echo "*" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "   Scripts  " & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "**"
if ($script > 36)
setvar $s 36
else
setvar $s $script
end
while ($k <= $s)
echo ansi_12 #9 & $key[$k] & ")" & #9 & ansi_14 $script[$k] & "*"
add $k 1
end
echo "*" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "   Scripts  " & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "*"
#pick one
setvar $choose ""
echo ansi_11 "*Choose a selection or Spacebar to cancel"
getconsoleinput $choose singlekey
if (($choose = "") or ($choose = 0) or ($choose = " "))
goto :wait
end
setvar $k 1
while ($k <= 36)
if ($choose = $key[$k])
setvar $num $k
goto :runtime
end
add $k 1
end
:runtime
if ($num = 0)
goto :wait
end
#load it and go back to start
setvar $temp1 $mask[$dupe]
striptext $temp1 "scripts\"
getwordpos $temp1 $pos "\"
if ($pos > 0)
setvar $temp $temp1
cuttext $temp $strip $pos 999
striptext $temp $strip
end
if ($pos > 0)
setvar $loader ("scripts\" & $temp & "\" & $script[$num])
else
setvar $loader ("scripts\" & $script[$num])
end
load $loader
goto :wait

:keyvariables
setarray $key 36
setvar $key[1] "1"
setvar $key[2] "2"
setvar $key[3] "3"
setvar $key[4] "4"
setvar $key[5] "5"
setvar $key[6] "6"
setvar $key[7] "7"
setvar $key[8] "8"
setvar $key[9] "9"
setvar $key[10] "0"
setvar $key[11] "a"
setvar $key[12] "b"
setvar $key[13] "c"
setvar $key[14] "d"
setvar $key[15] "e"
setvar $key[16] "f"
setvar $key[17] "g"
setvar $key[18] "h"
setvar $key[19] "i"
setvar $key[20] "j"
setvar $key[21] "k"
setvar $key[22] "l"
setvar $key[23] "m"
setvar $key[24] "n"
setvar $key[25] "o"
setvar $key[26] "p"
setvar $key[27] "q"
setvar $key[28] "r"
setvar $key[29] "s"
setvar $key[30] "t"
setvar $key[31] "u"
setvar $key[32] "v"
setvar $key[33] "w"
setvar $key[34] "x"
setvar $key[35] "y"
setvar $key[36] "z"
return


