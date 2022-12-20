############################################################
# Team SDT... By MicroBlaser
####################
# Uses standard mombot commands to control Team SDT.
#
# 22.08.09 Initial release.
# 22.08.12 Modified for use as a mombot daemon
reqVersion "2.6.09"
reqrecording
systemScript
$version := "v22.08b"
$Unlim := FALSE

#Run Messages - Since cash reported by SDT does not include EQU sitting
#               on planets, messages are based on turns run.
setArray $RunMsg 7
$RunMsg := 7
$RunMsg[1] := "Wow {redbot}! I didn't think anyone could run that long."
$RunMsg[2] := "600 Great run {redbot}! You are a god among insects."
$RunMsg[3] := "400 We are eating Prime Rib tonight! Way to go {redbot}!"
$RunMsg[4] := "300 Awesome Run! Someone give {redbot} a friggin medal."
$RunMsg[5] := "200 My grandmother could steal more that that blindfolded {redbot}."
$RunMsg[6] := "100 Hey little buddy, it's ok! You will do better next time {redbot}!"
$RunMsg[7] := "50 Thanks a lot {redbot}. We actually lost money on thet run."

setvar $to 1000
send "'Team SDT " $version " initializing!*"
gosub :wait

#TODO Help
#TODO must start at Command

$Prompt := "Command"
Gosub :GetPrompt

loadvar	$mode
loadvar $bot_name
         
#	$command 
#	$user_command_line 
# $bot~parm1
#	$bot~parm8
#	$bot~bot_turn_limit

#TODO Parse args

:Status
  killalltriggers
  settextlinetrigger S1 :Unlim "Unlimited"
  settextlinetrigger S2 :Start "Credits"
  send "i"
  pause

:Unlim
  $Unlim := TRUE
  pause

:start
killalltriggers
loadvar $bot_name
$timeout := 30000
$jet := 2625
$furb := 1
$file := (gamename & "_TSDT.txt")


fileexists $a $file
if ($a)
  gosub :load
else
  gosub :make
  gosub :save
end

:setup
gosub :show
getinput $a "Team SDT  <G>o  <E>dit info  <R>eset"
uppercase $a
if ($a="G")
  goto :begin
elseif ($a="E")
  gosub :edit
  gosub :save
  goto :start
elseif ($a="R")
  delete $file
  goto :start
else
  goto :setup
end

:begin
#setvar $to 1000
#send "'Team SDT " $version " initializing!*"
#gosub :wait
setvar $quit 0
settextouttrigger quit :quit "~"
echo "~H*Press the '~' key to shdown Team SDT.*"
gosub :wait
send "'" $bot_name " login*"
setvar $to 2000
gosub :wait
gosub :info

:main
if $quit
    send "'ShutDown Requested, Team SDT done.*"
    halt
end
gosub :who
if ($who=0)
  send "'Unable to continue, Team SDT done.*"
  halt
end
if $quit
    send "'ShutDown Requested, Team SDT done.*"
    halt
end
#gosub :info
echo "~H*Press the '~' key to ShutDown Team SDT.*"
setvar $to 10000
gosub :wait

gosub :run
setvar $to 1000
gosub :wait
#gosub :info
#gosub :wait
goto :main

:run
if ($kbot)
    # clear busts for colta and coltb
    #setvar $to 1000
    #setvar $c $colta
    #gosub :coltindex
    #send "'" $redbot " ClearBust in Sector " $port[$j] "..*"
    #gosub :wait
    #setvar $c $coltb
    #gosub :coltindex
    #send "'" $redbot " ClearBust in Sector " $port[$j] "..*"
    #gosub :wait
    #send "'" $redbot " busts clear*"
    #waiton "Bust File Empty"
end
if $dbot
    # clear busts for colta and coltb
    setvar $to 1000
    #setvar $c $colta
    #gosub :coltindex
    #send "'" $redbot " nobust " $port[$j] "*"
    #gosub :wait
    #setvar $c $coltb
    #gosub :coltindex
    #send "'" $redbot " nobust " $port[$j] "*"
    #gosub :wait
    send "'" $redbot " clearbusts*"
    gosub :wait
end
#if $dbot
    send "'" $redbot " sdt " $colta " " $coltb " " $plana " " $planb "*"
#else
#    send "'" $redbot " sdt " $colta " " $coltb "*"
#end

setvar $ss "credits in "
gosub :waitss
getword $ss $credits 3
getword $ss $sdtturns 6

setvar $ss "Busted in "
setvar $ss2 "Low Turns, Halting Script"
gosub :waitss2
getword $ss $bustcolt 4
striptext $bustcolt ","
setvar $needfurb 1
if ($bustcolt="Turns") or ($bustcolt="Script")
  setvar $needfurb 0
  setvar $done[$who] 1
  #waitfor "NO Bust, stopping"
  #cuttext currentline $w 1 1
  #if ($w="S")
  #  send "*"
  #else
  #  send "'" $redbot " mac " #42 #42 "*"
  #  setvar $ss "Macro Complete"
  #  gosub :waitss
  #end
  setvar $bot $redbot
  gosub :stats
  if ($ship=$colta)
    setvar $c $coltb
  else
    setvar $c $colta
  end
  gosub :coltindex
  setvar $last[$who] $j
  gosub :save
  goto :run2
elseif ($bustcolt="Busted")
  send "Invalid bust matrix, Fake Busted.*"
  halt
end
setvar $c $bustcolt
gosub :coltindex
setvar $bust[$j] $who
setvar $last[$who] $j
gosub :save

# Check if fuel port has fuel 
send "cr" $port[$j] "*q"
waiton "Fuel Ore"
getWord currentline $fs 3
getWord currentline $pf 4

# Upgrade port if fuel is low
if ($fs = "Buying") and ($pf < 2000)
  send "'" $redbot " mac o199" #42 "*"
  setvar $ss "Macro Complete"
  gosub :waitss

#remove
setvar $to 10000
gosub :wait

end


if $furbmethod=0
    if ($furb<>0) and ($furblet<>"0")
      send "'" $bluebot " furb " $bustcolt " " $furbadd " " $furblet "*"
      setvar $ss "Furb delivered"
      gosub :waitss
      if ($w="'")
        waitfor "All Systems Ready, shall we engage? Yes"
        waitfor "Command [TL="
      end
      if ($kbot)
        setvar $ss "I now have "
      else
    end
end
:run2
if ($kbot)
    send "'" $bot " bot on*"
    waiton "Kbot Activ"
end
send "'" $redbot " xport " $safe "*"
setvar $ss "Xport complete."
gosub :waitss
if ($kbot)
    waiton "Shipinfo Loaded"
end

# TopOff Blue Bot
# TODO Check fig couunt first if in turn game.
send "'" $bluebot " mac psspb9999" #42 "c9999" #42 "qqq/*"
setvar $ss "Macro Complete"
gosub :waitss

#Always hated this... lol
#send "'Nice run " $redbot "!*"

if ($furb<>0) and ($needfurb<>0) and ($furbmethod=1)
  setvar $bot $bluebot
  gosub :stats
  setvar $safe $ship
  send "'" $bluebot " xport " $bustcolt "*"
  setvar $ss "Xport complete."
  gosub :waitss
  setvar $c $bustcolt
  gosub :coltindex
  setvar $bustsec $port[$j]
  setvar $s0 $bustsec
  setvar $s1 1
  gosub :fuelcalc
  setvar $fuel $f
  setvar $s0 1
  setvar $s1 $bustsec
  gosub :fuelcalc
  add $fuel $f
  send "'" $bluebot " mac j y p t " $fuel #42 " " #42 " 0" #42 " 0" #42 " *"
  setvar $ss "Macro Complete"
  gosub :waitss
  gosub :stats
  send "'" $bluebot " twarp 1*"
  setvar $ss "T-warp completed."
  gosub :waitss
  send "'" $bluebot " mac " #42 "*"
  setvar $ss "Macro Complete"
  gosub :waitss
  send "'" $bluebot " mac p t y a 128" #42 " y a 64" #42 " y a 32" #42 " y a 16" #42 " y a 8" #42 " y a 4" #42 " y a 2" #42 " y a 1" #42 " y q *"
  setvar $ss "Macro Complete"
  gosub :waitss
  send "'" $bluebot " twarp " $sector "*"
  setvar $ss "T-warp completed."
  gosub :waitss
  send "'" $bluebot " mac " #42 "*"
  setvar $ss "Macro Complete"
  gosub :waitss
  if $decasher>0
    send "'" $bluebot " xport " $decasher "*"
    setvar $ss "Xport complete."
    gosub :waitss
    gosub :decash
  end    
  send "'" $bluebot " xport " $safe "*"
  setvar $ss "Xport complete."
  gosub :waitss
end
return

:waitss
setvar $ss2 "~~~~~~~~"
:waitss2
setvar $ss3 "~~~~~~~~"
:waitss3
setvar $ssn 0
settextlinetrigger w :waitss11 $ss
settextlinetrigger w2 :waitss12 $ss2
settextlinetrigger w3 :waitss13 $ss2
pause
:waitss11
killtrigger w2
killtrigger w3
setvar $ssn 1
goto :waitss9
:waitss12
killtrigger w
killtrigger w3
setvar $ssn 2
goto :waitss9
:waitss13
killtrigger w
killtrigger w2
setvar $ssn 3
:waitss9
cuttext currentline $w 1 1
if ($w="R")
  cuttext currentline $ss0 10 999
elseif ($w="'")
  cuttext currentline $ss0 2 999
elseif ($w="S")
  cuttext currentline $ss0 4 999
else
  goto :waitss9
end
setvar $ss $ss0
return

:waitsdt
setvar $ssn 0
settextlinetrigger wt :waitsdt11 $ss
settextlinetrigger wt2 :waitsdt12 $ss2
settextlinetrigger wt3 :waitsdt13 $ss3
setdelaytrigger wd :waitssd $to
pause
:waitsdt11
killtrigger wt2
killtrigger wt3
killtrigger wd
setvar $ssn 1
goto :waitsdt9
:waitsdt12
killtrigger wt
killtrigger wt3
killtrigger wd
setvar $ssn 2
goto :waitsdt9
:waitsdt13
killtrigger wt
killtrigger wt2
killtrigger wd
setvar $ssn 3
:waitsdt9
cuttext currentline $w 1 1
if ($w="R") or ($w="'")
  cuttext currentline $ss 10 999
elseif ($w="S")
  cuttext currentline $ss 4 999
else
  goto :waitsdt
end
return
:waitssd
killtrigger wt
killtrigger wt2
killtrigger wt3
setvar $ss "timed out"
return

:wait
setdelaytrigger wa :wait1 $to
pause
:wait1
return

:exp
send "'" $redbot " qss*"
setvar $ss "EXP = "
setvar $ss2 "Experience:"
gosub :waitss2
if $ssn=1
    getword $ss $exp 3
else
    gettext $ss $exp "Experience:" " "
end
return

:stats
setvar $kb 0
setvar $db 0
send "'" $bot " status*"
setvar $ss "{" & $bot & "}   --- Status Report ---"
setvar $ss2 ">>>KraakenBot Status<<<"
setvar $ss3 "--- Status Update ---"
setvar $to $timeout
gosub :waitsdt
if ($ss<>"timed out")
    if ($ssn=1)
        setvar $ss "- Sector"
        gosub :waitss
        getword $ss $sector 4
        setvar $ss "- Prompt"
        gosub :waitss
        getword $ss $pprompt 4
        setvar $ss "- Turns"
        gosub :waitss
        getword $ss $turns 4
        setvar $ss "- Ship"
        gosub :waitss
        getword $ss $ship 4
        setvar $ss " Planet ="
        gosub :waitss
        getwordpos $ss $test "Last"
        if $test=0
            getword $ss $pplanet 4
        else
            getword $ss $pplanet 5
        end
    elseif ($ssn=2)
        setvar $kb 1
        waiton "Safesector  = "
        send "'" $bot " qss*"
        setvar $ss " Turns     : "
        gosub :waitss
        getword $ss $turns 6
        setvar $ss " Ship      : "
        gosub :waitss
        getword $ss $ship 9
    elseif $ssn=3
        setvar $db 1
        setvar $ss "Sector   :"
        gosub :waitss
        gettext $ss $sector "Sector   :" " "
        gettext $ss $ship "Ship ID   :" " "
        gettext $ss $pplanet "Planet # :" " "
        setvar $ss "Turns    :"
        gosub :waitss
        gettext $ss $turns "Turns    :" " "
        setvar $ss "Prompt:"
        gosub :waitss
        gettext $ss $pprompt "Prompt:" " "
    end
    if ($shipsscanned=0)
        gosub :shipscan
    end
end
return

:who
setvar $who 0
setvar $hiturns 0
setvar $i 1
while ($i<=$nr)
  setvar $ok 0
  setvar $j 1
  while ($j<=$nc)
    if ($bust[$j]<>$i)
      add $ok 1
      setvar $pair[$ok] $j
    end
    add $j 1
  end
  if ($ok>=2) and ($done[$i]=0)
    setvar $bot $red[$i]
    gosub :stats
    if ($ss<>"timed out")
      if ($Unlim = TRUE)
        $turns := 999999
      end
      if ($turns>=50)
        if ($turns>$hiturns)
          setvar $who $i
          setvar $redbot $red[$who]
          setvar $kbot $kb
          setvar $dbot $db
          setvar $hiturns $turns
          setvar $safe $ship
          if ($pair[1]<>$last[$i])
            setvar $colta $colt[($pair[1])]
            setvar $coltb $colt[($pair[2])]
            setvar $plana $planet[($pair[1])]
            setvar $planb $planet[($pair[2])]
          else
            setvar $colta $colt[($pair[2])]
            setvar $coltb $colt[($pair[1])]
            setvar $plana $planet[($pair[2])]
            setvar $planb $planet[($pair[1])]
          end
        end
      else
        setvar $done[$i] 1
      end
    else
      send "'No response, skipping " $bot " for now.*"
    end
  end
  add $i 1
end
return

:info
#$info := "~G Colts Sector Planet Bust Holds    Bots  last exp align turns  *"
$info := "~g Colts Sector Planet Bust     Bots  Last R/S*"
$info &= "~f ----- ------ ------ -----    ----- --------*"

#$info &= "~D "  $colt[1] "   " $port[1] "    " $planet[1] "   100"  "~C " $bluebot "      750    2000 UNLIM*"


$i := 1
$j := 0
while ($i<=$nc) or ($j<=$nr)
  if ($i <= $nc)
    if ($bust[$i]=0)
      $b := " -=- "
    else
      $b := $red[($bust[$i])]
    end
    $c := $colt[$i]
    $p := $port[$i]
    $t := $planet[$i]
    padRight $c 3 
    padRight $p 5 
    padRight $t 4 
    padRight $b 5 

    $info &= "~D  " $c "~F   " $p "~G  #" $t "~B " $b
  else
    $info &= "                            "
  end
  $i++

  if ($j = 0)
    $b := $bluebot
    padRight $b 5
    $info &= "~C    "  $b ""
  else
    while ($skip[$j]=1)
      $j++
    end

    if ($j <= $nr)
      if (last[$j]=0)
        $l := " -=- "
      else
        $l := $colt[($last[$j])]
      end
      $r :=  $red[$j]
      padRight $r 5
      padRight $l 5
      $info &= "~B    "  $r "~G   " $l
    end
  end
  $j++

  $info &= "*"
end

#$info &= "*:" $credits ":" $sdtturns ":" $RunMsg ":**"
stripText $credits ","

if ($sdtturns > 0)
  if ($credits > 0)
    $totalcredits += $credits
    format $credits $rc NUMBER
    format $totalcredits $tc NUMBER
    $info &= " *We made " $rc " this run, for a total of " $tc " credits.*"
  else
    $info &= " *Equipment was stored on planet, but not sold yet.*"
  end

  $msg := $RunMsg[1]
  $i := 2
  while ($i <= $RunMsg)
    GetWord $RunMsg[$i] $rt 1
    #$info &= ":" $rt ":>:" $sdtturns ":"
    if ($rt > $sdtturns)
      $msg := $RunMsg[$i]
      #$info &= "TRUE:"
      stripText $msg ($rt & " ")
    end
   # $info &= "*"
    $i++
  end
  replaceText $msg "{redbot}" $redbot
  $info &= $msg
else
  $info &= "Let's Rock and Roll...*"
end
$info &= " **"

stripANSI $txtinfo $info
send "'*[" $mode "] {" $bot_name "} -=- Team SDT matrix:* *"
send $txtinfo
send #145
waitOn #145 & #8
echo "~!~F  -=- Team SDT matrix:* *"
echo $info
return

:coltindex
setvar $j 1
while ($j<=$nc)
  if ($colt[$j]=$c)
    return
  end
  add $j 1
end
send "'-=- Error Invalid Colt # -=-*"
halt

:load
setvar $r 1
gosub :read
setvar $bluebot $a
gosub :readn
setvar $nr $a
setvar $i 1
while ($i<=$nr)
  gosub :read
  setvar $red[$i] $a
  add $i 1
end
gosub :readn
setvar $nc $a
setvar $j 1
while ($j<=$nc)
  gosub :readn
  setvar $colt[$j] $a
  add $j 1
end
gosub :read
setvar $j 1
while ($j<=$nc)
  gosub :readn
  setvar $bust[$j] $a
  add $j 1
end
gosub :read
setvar $i 1
while ($i<=$nr)
  gosub :readn
  setvar $last[$i] $a
  add $i 1
end
gosub :read
setvar $i 1
if ($a<>eof)
  while ($i<=$nr)
    gosub :readn
    setvar $skip[$i] $a
    setvar $done[$i] $a
    add $i 1
  end
end
gosub :read
if ($a<>eof)
  gosub :read
  if $a="twarp"
    setvar $furbmethod 1
    gosub :readn
    setvar $decasher $a
  else
    getlength $a $check
    if ($check<>1)
      goto :baddata
    end
    setvar $furblet $a
    gosub :readn
    setvar $furbadd $a
  end
else
  setvar $furblet "h"
  setvar $furbadd 33
end
gosub :GetPlanets
return

:readn
gosub :read
isnumber $check $a
if ($check=1)
  return
end
:baddata
send "'-=- Error - Bad Data -=-*"
halt

:read
read $file $b $r
add $r 1
getword $b $a 1
return

:save
delete $file
write $file $bluebot & " furbing"
write $file $nr & " reds:"
setvar $i 1
while ($i<=$nr)
  write $file $red[$i]
  add $i 1
end
write $file $nc & " colts:"
setvar $j 1
while ($j<=$nc)
  write $file $colt[$j]
  add $j 1
end
write $file "busts:"
setvar $j 1
while ($j<=$nc)
  write $file $bust[$j]
  add $j 1
end
write $file "lasts:"
setvar $i 1
while ($i<=$nr)
  write $file $last[$i]
  add $i 1
end
write $file "skip:"
setvar $i 1
while ($i<=$nr)
  write $file $skip[$i]
  add $i 1
end
write $file "furb:"
if $furbmethod
    write $file "twarp"
    write $file $decasher
else
    write $file $furblet
    write $file $furbadd
end
return

:make

#TODO turn comms off for setup
getinput $bluebot "Nane of your Blue bot:"
getinput $nr "how many Reds?"
getinput $a "enter Red bot names seperated by spaces:"
setvar $i 1
while ($i<=$nr)
  getword $a $red[$i] $i
  setvar $last[$i] 0
  add $i 1
end
getinput $nc "how many Colts?"
getinput $a "enter Colt #'s seperated by spaces:"
setvar $j 1
while ($j<=$nc)
  getword $a $colt[$j] $j
  setvar $bust[$j] 0
  add $j 1
end
setvar $furbmethod 0
getinput $a "Use regular Salvage or Twarpable colts furbing ([S]/T)"
uppercase $a
if $a="T"
    setvar $furbmethod 1
    getinput $decasher "decashing ship # (0 for none) [0]"
    if $decasher=""
        setvar $decasher 0
    end
else
    getinput $furblet "enter furb buying letter or none for standard merf furb (0 for none)"
    if ($furblet="")
      setvar $furblet "h"
      setvar $furbadd 33
    else
      getinput $furbadd "how many holds to add?"
    end
end
Gosub :GetPlanets
return

:show
echo ansi_15 "*"
echo "Blue bot: " $bluebot
echo "*Red bots: "
setvar $i 1
while ($i<=$nr)
  echo " " $red[$i] " "
  if ($skip[$i])
    echo "(skip) "    
  end
  add $i 1
end
echo " *Colts: "
setvar $j 1
while ($j<=$nc)
  echo "#" $colt[$j] " "
  add $j 1
end
echo "*Busts: "
setvar $j 1
while ($j<=$nc)
  if ($bust[$j]=0)
    echo "none "
  else
    echo $red[($bust[$j])] " "
  end
  add $j 1
end
echo "*Last Steals: "
setvar $i 1
while ($i<=$nr)
  if ($last[$i]>0)
    echo "#" $colt[($last[$i])] " "
  else
    echo "none "
  end
  add $i 1
end
echo "*Furb: "
if $furbmethod
    if $decasher>0
        echo "Twarp, decashing ship #" $decasher "*"
    else
        echo "Twarp, no decashing*"
    end
else
    if ($furblet="0")
      echo "none*"
    else
      echo $furblet " " $furbadd "*"
    end
end
return

:edit
getinput $a "Edit <F>urbing <C>olts <B>ust <L>ast-steal <S>kip"
uppercase $a
if ($a="F")
  goto :editfurb
elseif ($a="C")
  goto :editcolt
elseif ($a="B")
  goto :editbust
elseif ($a="L")
  goto :editlast
elseif ($a="S")
  goto :editskip
else
  clientmessage "invalid choice"
  return
end

:editfurb
getinput $bluebot "Blue bot name:"
setvar $furbmethod 0
getinput $a "Use regular Salvage or Twarpable colts furbing ([S]/T)"
uppercase $a
if $a="T"
    setvar $furbmethod 1
    getinput $decasher "decashing ship # (0 for none) [0]"
    if $decasher=""
        setvar $decasher 0
    end
else
    getinput $furblet "enter furb buying letter or none for standard merf furb (0 for none)"
    if ($furblet="")
      setvar $furblet "h"
      setvar $furbadd 33
    else
      getinput $furbadd "how many holds to add?"
    end
end
return

:editcolt
getinput $a "enter new Colt #'s seperated by spaces:"
setvar $j 1
while ($j<=$nc)
  getword $a $colt[$j] $j
  add $j 1
end
return

:editbust
getinput $c "change Bust for which Colt #"
setvar $i 1
while ($i<=$nc)
  if ($colt[$i]=$c)
    getinput $a "who is Busted in this Colt (0 = no one)"
    if ($a="0")
      setvar $bust[$i] 0
      return
    else
      setvar $j 1
      while ($j<=$nr)
        if ($a=$red[$j])
          setvar $bust[$i] $j
          return
        end
        add $j 1
      end
    end
    clientmessage "red not found"
    while ($j<=$nr)
      if ($a=$red[$j])
        setvar $bust[$i] $j
        return
      end
      add $j 1
    end
    clientmessage "red not found"
    return
  end
  add $i 1
end
clientmessage "Colt not found"
return

:editlast
getinput $a "which red"
setvar $i 1
while ($i<=$nr)
  if ($a=$red[$i])
    getinput $c "Last stole in which Colt #"
    setvar $j 1
    while ($j<=$nc)
      if ($colt[$j]=$c)
        setvar $last[$i] $j
        return
      end
      add $j 1
    end
    clientmessage "Colt not found"
    return
  end
  add $i 1
end
clientmessage "red not found"
return

:editskip
getinput $a "skip which red (0 = run all)"
if ($a="0")
  setvar $i 1
  while ($i<=$nr)
    setvar $skip[$i] 0
    add $i 1
  end
  return
end
setvar $j 1
while ($j<=$nr)
  if ($a=$red[$j])
    setvar $skip[$j] 1
    return
  end
  add $j 1
end
clientmessage "red not found"
return

:shipscan
send #145
waiton #145
getword currentline $prompt 1
striptext $prompt #145
striptext $prompt #8
if ($prompt="Command") or ($prompt="Citadel")
    send "CZQ"
else
    send "QQQZ*CZQ"
end
waiton "<Active Ship Scan>"
settextlinetrigger 1 :shipscan1 "---------------"
pause
:shipscan1
settextlinetrigger 1 :shipscan2 ""
pause
:shipscan2
if (currentline="")
    goto :shipscan3
end
getword currentline $shippy 1
getword currentline $sector 2
setvar $index 1
while ($index<=$nc)
    if ($shippy=$colt[$index])
        setvar $port[$index] $sector
    end
    add $index 1
end
goto :shipscan1
:shipscan3
setvar $shipsscanned 1
return

:quit
setvar $quit 1
send "'-=- Team SDT stop requested -=- Finishing Round -=-.*"
pause

:decash
setvar $mac ""
setvar $i 1
while $i<=$nr
    setvar $mac $mac & "TC"
    setvar $j $i
    while $j>1
        setvar $mac $mac & "N"
        subtract $j 1
    end
    setvar $mac $mac & "Y" & #42 & "Z999999999" & #42 & "Z" & #42
    add $i 1
end
send "'" $bluebot " mac " $mac "*"
setvar $ss "Macro Complete"
gosub :waitss
return

:fuelcalc
getdistance $d $s0 $s1
if $d<0
    send "^F" $s0 "*" $s1 "*Q"
    getdistance $d $s0 $s1
    if $d<0
        send "'-=- Error unble to navigate -=-*"
        HALT
    end
end
setvar $f $d*3
return


:GetPlanets
    if ($shipsscanned=0)
        gosub :shipscan
    end

  send "tl*"
  waiton "==="

  killalltriggers
  settextlinetrigger GP1 :PlanetLine
#  settextlinetrigger GP2 :NoPlanets "No Planets"
  pause 

:NoPlanets
  echo "***-------- No Planets --------***"
  send "'[" $mode "] {" $bot_name "} -=- You forgot to create planets. DOH!"
  halt


:PlanetLine
  GetWord currentline $sect 1
  GetWord currentline $pn 2
  stripText $pn "#" 

  if ($sect = "No") and ($pn = "Planets")
    send "'[" $mode "] {" $bot_name "} -=- You forgot to create planets. DOH!*"
    halt
  end

  if ($sect = "======")
    goto :PlanetsDone
  end
#echo "**----" $sect "--" $pn "--**"

  $index := 1
  while ($index <= $nc)
      if ($sect = $port[$index]) and (($planet[$index] = "") or ($planet[$index] = "0"))
          $planet[$index] := $pn
      end
      add $index 1
  end
  settextlinetrigger GS1 :SecondLine
  pause

:SecondLine
  settextlinetrigger GS1 :PlanetLine
  pause

:PlanetsDone
  $index := 1
  while ($index <= $nc)
    #echo ansi_15 "**---------------------"  $planet[$index] "--**"
    if ($planet[$index] = "") or ($planet[$index] = "0")
      send "'[" $mode "] {" $bot_name "} -=- There is no planet in sector " $port[$index] ". DOH!*"
      halt
    end

    add $index 1
  end
  
return

:GetPrompt
send "/" #145
WaitOn #145 & #8

GetWord currentline $p 1
if ($p <> $prompt)
  send "qqq***/" #145
  WaitOn #145 & #8
end

GetWord currentline $p 1
if ($p <> $prompt)
  send "'-=- This command must ne run from the " $prompt " Prompt. -=-"
  halt
end
return

