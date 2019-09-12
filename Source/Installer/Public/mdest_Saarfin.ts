#  Saarducci Find v 1.0
clientMessage "Running Saarducci Find 1.0**"
# fig array blatently stolen from oz
:get_da_figs
setVar $figfile "_ck_" & GAMENAME & ".figs"
setVar $read_count 0
setVar $merge_count 1
:read
add $read_count 1
read $figfile $read[$read_count] $read_count
if ($read[$read_count] = "EOF")
	goto :done_read
end
if ($read_count > 1)
	mergeText $read[1] $read[$read_count] $read[1]
end
goto :read

:done_read
:set_fig_array
setArray $figlist SECTORS
setVar $fig_array_count 0
:make_array
add $fig_array_count 1
if ($fig_array_count > SECTORS)
	goto :done_fig_array
end
getWord $read[1] $fig_check $fig_array_count
if ($fig_check <> 0)
	setVar $figlist[$fig_array_count] 1
end
goto :make_array

:done_fig_array
setVar $figlist[3256] 1
echo "**" ANSI_14
delete "base.txt"
setvar $t 11
setvar $f 7882
setvar $f1 1
while $t<>SECTORS
 if ($figlist[$t]=1)
# getdistance $d $f $t
# if ($d=5)
#  if ($d>1)
  if (sector.warpcount[$t]=2)
#   if (port.class[$t]=5)
#    if (port.percentequip[$t]<50)
#     if (port.buyfuel[$t]=0)
#      if (port.percentfuel[$t]<100)
#       if (port.percentfuel[$t]>10)
         getdistance $d $f $t
         getdistance $d1 $f1 $t
          if ($d > 8)
           if ($d1 > 8)
            echo $t " " $d " " $d1 "*"
            write "base.TXT" $t & " " & $d & " " & $d1
           end
          end
     end
    end
#   end 
#  end
# end
# end
add $t 1
end
sound alert.wav
#  
# 1006,1018,1069,1121,1189
# 1496,1586,1608,1628,1647,1918,1943,2057,2145,2212,2379
# 2399,2442,2468,2497,2529,2549,2860,2961,3007,3012,3168
# 3282,3289,3376,3424,3466,3523,3720,3806,4031,4052,4060
# 4102,4357,4403,4407,4416,4635,4693,4873,4915,4951,4962   
# 1248,1280,1284,1316,1321,1340,1376,1386,1411,1427,1524
# 1542,1552,1568,1577,1611,1636,1644,1706,1783,1807,1832
# 1877,1901,1906,2023,2046,2053,2157,2180,2181,2220,2247
# 2252,2444,2493,2497,2542,2589,2770,2777,2782,2855,2948
# 3013,3077,3096,3181,3228,3265,3308,3442,3498,3527,3573
# 3682,3699,3727,3754,3803,3821,3852,3891,3914,3923,4045
# 4062,4096,4197,4209,4335,4353,4407,4452,4513,4536,4672
# 4717,4827,4846,4871,4877,4932
# 9840,9854,9894,9905,9934,9940,9941,9947,9949,9955,9963,9967,9972,9993 
# 9248,9272,9275,9277,9285,9308,9317,9318,9358,9381,9397,9408,9457,9459
