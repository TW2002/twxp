#Parrots Menu fun
#text file containing masks
setvar $pompousjerk (#27 & "[5;32m" & " Super Deluxe FileReader ")
setvar $ansistuff (ansi_7 & "-" & ansi_8 & "=" & ansi_15 & #42 & ansi_8 & "=" & ansi_7 & "-")
#set key codes here
gosub :keyvariables
setvar $menulabel "Super Deluxe FileReader"
setvar $menuone (#27 & "[41;33m" & $menulabel & #27 & "[0m")
addMenu "TWX_MAIN" "Super Deluxe FileReader" $menuone "Y" ":start" "Menu" FALSE
:wait
pause
:start
setvar $choosemask "*" & GAMENAME & "*.txt"
getFileList $script $choosemask
setvar $k 1
echo #27 & "[1A" & #27 & "[K"
echo "*" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & $pompousjerk & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "**"
while ($k <= $script)
echo ansi_12 #9 & $key[$k] & ")" & #9 & ansi_14 $script[$k] & "*"
add $k 1
end
echo "*" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & $pompousjerk & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "*"
#pick one
setvar $choose ""
echo ansi_11 "*Choose a selection or Spacebar to cancel"
getconsoleinput $choose singlekey
if (($choose = "") or ($choose = 0))
goto :wait
end
if ($script >= 36)
setvar $temp 36
elseif ($script > 0)
setvar $temp $script
else
goto :wait
end
setvar $k 1
while ($k <= $temp)
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
readtoarray $script[$num] $filer
setvar $k 1
setvar $j 1
echo "**" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & $pompousjerk & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "*"
while ($k <= $filer)
echo ansi_15 $filer[$k] & "*"
#set lines to show here
if ($j = 30)
setvar $j 1
killtrigger pauseit
echo ansi_14 "[Pause]*" ansi_15
settextouttrigger pauseit :pauseit
pause
:pauseit
end
add $k 1
add $j 1
end
echo "**" & $ansistuff & $ansistuff & $ansistuff & $ansistuff & $pompousjerk & $ansistuff & $ansistuff & $ansistuff & $ansistuff & "*"
send " * "
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


