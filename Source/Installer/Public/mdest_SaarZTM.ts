#  Saarducci ZTM v 1.0
clientMessage "Running Saarducci ZTM 1.0"
# Befor starting create a new database and toggle client deaf
# Actually a new DB not necessary, unless you want an eprobe file
# to use later in the game when you're ahead and just want to search
# for stragglers, missing planets etc.
# some control variables stored in a file to facilitate stopping
# and restarting the script would be a nice improvment...
Setvar $dbc 0
# check if new DB
# This script should be run from a clean database to properly write
# the eprobe file
setvar $dbc 1
# check for known SD
#          The StarDock is located in sector 2597.
Setvar $sd 0
Setvar $sd 3241
# If we know whed SD is we'll plot courses from there and write a 
# file of sectors to eprobe from SD
IF ($sd <> 0)
 setvar $ss $sd
else
 setvar $ss 1
end
# STILL HAVEN'T FIGURED OUT HOW TO TOGGLE DEAF FM INSIDE SCRIPT
# processout "$=Q"
# openMenu TWX_TOGGLEDEAF  
# closemenu
setVar $i 11
setvar $c 0
send "^"
echo ANSI_14 "**Plotting Outbound Courses**"
:next
if (SECTOR.EXPLORED[$i] = "NO")
  add $c 1
  echo $i " "
  if ($c=10)
   echo "*"
   setvar $c 0
  end
  SetTextTrigger 1 :loop1 ":" 
  send "F" $ss "*" $i "*"
  pause
  :loop1
end
if ($i = SECTORS)
  goto :epfile
end
add $i 1
goto :next
# At this point any sector with no outbound warps is the most 
# distant from SD along any given route.
:epfile
# write eprobe file
If ($dbc=1)
 IF ($sd<>0)
  echo "**Writing Eprobe.txt**"
  setvar $i 2
  delete eprobe.txt
:next3
   if (SECTOR.EXPLORED[$i] = "NO")
    write "eprobe.txt" $i
   end
   if ($i = SECTORS)
    goto :part2
   end
  add $i 1
  goto :next3
 end
end
:part2
# now plot courses back to Terra from the sectors with no outbounds
setVar $i 11
setvar $c 0
echo "**Plotting Inbound Courses**"
:next1
  IF (SECTOR.WARPCOUNT[$i] = 0) 
  add $c 1
  echo $i " "
  if ($c=10)
   echo "*"
   setvar $c 0
  end
   SetTextTrigger 1 :loop2 ":" 
   send "F" $i "*1*"
   pause
   :loop2
  end
  if ($i = SECTORS)
   goto :part3
  end
add $i 1
goto :next1
:part3
# set avoids on all know outbound warps and look for addl out warps
setVar $i 14999
setvar $c1 0
setvar $c2 0
subtract $c1 1
setvar $c 0
echo "**Avoiding Known Sectors**"
:next2
KillAllTriggers
setVar $j SECTOR.WARPCOUNT[$i]
:setavoids
# need to make an array here and avoid setting avoids already set.
send "S"
waitfor "Sector:"
send SECTOR.WARPS[$i][$j] "*"
  if $j > 1
    subtract $j 1 
    goto :setavoids
  end
:plotback
  add $c1 1
  setvar $d 1
  if (SECTOR.WARPS[$i][1] = 1) 
    setvar $d 2
  end 
send "F"
waitfor "FM >"
send $i "*"
waitfor "TO >"
KillAllTriggers
SetTextTrigger 1 :next2 ":" 
SetTextTrigger 2 :sectdone "Clear Avoids?" 
send $d "*"
pause
:sectdone
echo $i " " $c1 " "
  add $c 1
  add $c2 $c1
  setvar $c1 0
  subtract $c1 1
  if ($c=10)
   echo $c2 "*"
   setvar $c 0
  end
KillAllTriggers
send "Y*"
if ($i = SECTORS)
  goto :part4
end
add $i 1
goto :next2
:part4
# all thats left should be inbound warps to deadends
# either 1-ways or masked by a oneway.
# but checking all but sectors 1-7 for oneway in.
# will prolly add plotting a course from SD to 1-7
# Maybe add a menu and make this optional, eprobe file too
setVar $i 12000
setvar $c 0
echo "**Searching for Backdoors to Deadends**"
:next4
KillAllTriggers
setVar $j SECTOR.WARPINCOUNT[$i]
:setavoids2
send "S"
waitfor "Sector:"
send SECTOR.WARPSIN[$i][$j] "*"
  if $j > 1
    subtract $j 1 
    goto :setavoids2
  end
:plotto
  add $c 1
  echo $i " "
  if ($c=10)
   echo "*"
   setvar $c 0
  end
setvar $d 1
send "F"
waitfor "FM >"
send $d "*"
waitfor "TO >"
KillAllTriggers
SetTextTrigger 1 :next4 ":" 
SetTextTrigger 2 :sectdone1 "Clear Avoids?" 
send $i "*"
pause
:sectdone1
KillAllTriggers
send "Y*"
if ($i = SECTORS)
  send "q"
  openMenu TWX_TOGGLEDEAF  
  goto :keepalive
end
add $i 1
goto :next4
:keepalive
# we never get here hangs at the menu command
halt

# 523    842   1161   1225   2046   4125   4209  USOP AVOIDS EPROBE
# 246,1230,1240,3424,3611,3847
