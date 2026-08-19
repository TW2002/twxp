:move~move




















































settextlinetrigger 1 :GETSECTOR "Sector  : "
pause
:move~getsector
getword CURRENTLINE $move~cursector 3


setvar $move~history[9] $move~history[8]
setvar $move~history[8] $move~history[7]
setvar $move~history[7] $move~history[6]
setvar $move~history[6] $move~history[5]
setvar $move~history[5] $move~history[4]
setvar $move~history[4] $move~history[3]
setvar $move~history[3] $move~history[2]
setvar $move~history[2] $move~history[1]
setvar $move~history[1] $move~cursector

if ($move~confirmsector = 1)

  settextlinetrigger TOLLFIGS :TOLLFIGS "You have to destroy the fighters or pay"
  settextlinetrigger FIGS :FIGS "You have to destroy the fighters to remain"
  settexttrigger MINES :MINEPROMPT "Mined Sector:"
  settexttrigger ARRIVED :ARRIVED "Command [TL="
  pause
  :move~tollfigs

  if ($move~attack = 3)

    send "py"
  else

    send "a9999*"
  end
  pause
  :move~figs

  send "a9999*"
  pause
  :move~mineprompt

  send "*"
  pause
  :move~arrived

  killtrigger TOLLFIGS
  killtrigger FIGS
  killtrigger MINES
else
  waiton "Command [TL="
end

getsector $move~cursector $move~cursector
setvar $move~confirmsector 0
setvar $move~found 0
setvar $move~noscan 0

gosub $move~checksub

if ($move~found = 1)
  return
end


if (($move~scanholo = 2) and ($move~noscan < 2))
  setvar $move~scannedholo 1
  send "shsd"
  waiton "Relative Density Scan"
  waiton "Command [TL="
elseif ($move~noscan = 0)

  setvar $move~scannedholo 0
  send "sd"
  waiton "Relative Density Scan"
  waiton "Command [TL="
end

getsector $move~cursector $move~cursector
:move~assess


setvar $move~i 1
setvar $move~bestscore 1000
setvar $move~bestwarp 0
setvar $move~bestattack 0
setvar $move~willholo 0
:move~testwarp

if ($move~cursector.warp[$move~i] > 0)
  setvar $move~score 0
  setvar $move~safe 1

  getsector $move~cursector.warp[$move~i] $move~thissector

  if ($move~evasion <> 2)
    if ($move~scannedholo = 0)


      if (($move~thissector.density <> 0) and ($move~thissector.density <> 100))
        if (($move~thissector.density = 5) or ($move~thissector.density = 105))
          setvar $move~safe 2
        else
          setvar $move~safe 0
        end
      end
    end
    if ($move~scannedholo = 1)


      if ($move~thissector.anomoly = "YES")

        setvar $move~safe 0
      end
      if (($move~thissector.figs.owner <> "belong to your Corp") and (($move~thissector.figs.owner <> "yours") and ($move~thissector.figs.quantity > 0)))
        if ($move~evasion = 1)
          setvar $move~safe 0
        else


          setvar $move~safe 2

          if ($move~thissector.figs.quantity > 20)
            setvar $move~safe 0
          end
        end
      end
      if ($move~thissector.density > 0)
        setvar $move~density $move~thissector.density

        if ($move~thissector.figs.quantity > 0)
          setvar $move~x $move~thissector.figs.quantity
          multiply $move~x 5
          subtract $move~density $move~x
        end

        if ((($move~density <> 100) or ($move~thissector.port.exists = 0)) and ($move~density > 0))
          setvar $move~safe 0
        end
      end
    end
  end


  if (($move~safe = 2) and ($move~evasion = 1))
    add $move~score 500
  end

  if ($move~safe = 0)
    add $move~score 500
    setvar $move~willholo 1
  end


  setvar $move~x 1
  :move~checkhistory
  if ($move~x <= 10)
    if ($move~history[$move~x] = $move~cursector.warp[$move~i])
      setvar $move~m 10
      subtract $move~m $move~x
      multiply $move~m 10
      add $move~score $move~m
    end
    add $move~x 1
    goto :CHECKHISTORY
  end

  if ($move~portpriority = 1)

    if (($move~scannedholo = 1) and ($move~thissector.port.exists = 1)) or (($move~scannedholo = 0) and ($move~thissector.density = 100))
      subtract $move~score 3
    end
  end

  if ($move~dedpriority = 1)

    if ($move~thissector.warps = 1)
      subtract $move~score 3
    end
  end


  getrnd $move~random 1 5
  add $move~score $move~random

  if ($move~score < $move~bestscore)
    setvar $move~bestscore $move~score
    setvar $move~bestwarp $move~cursector.warp[$move~i]
    setvar $move~bestsafe $move~safe
  end

  add $move~i 1
  goto :TESTWARP
end

if ($move~bestscore > 400)

  setvar $move~willholo 1
end

if (($move~willholo = 1) and (($move~scannedholo = 0) and ($move~scanholo = 1)))

  send "sh"
  waitfor "Sector  : "
  waitfor "Command [TL="
  setvar $move~scannedholo 1
  goto :ASSESS
end

if (($move~bestscore > 400) and ($move~evasion = 1))
  clientmessage "No safe options!"
  halt
end


if (($move~extrasend <> "") and (($move~cursector > 10) and (PORT.CLASS[$move~cursector] < 9)))
  send $move~extrasend
end


if ((SECTORS > 5000) or ($move~bestwarp < 600))
  setvar $move~warpsuffix "*"
else
  setvar $move~warpsuffix "."
end


if (($move~bestsafe = 2) and ($move~attack = 1)) or ($move~attack = 2)
  send $move~bestwarp $move~warpsuffix "*na9999**"
else
  send $move~bestwarp $move~warpsuffix
  setvar $move~confirmsector 1
end

goto :MOVE
:move~menu






addmenu $move~menu "Move" "Navigation Settings" "M" "" "Nav" FALSE
addmenu "Move" "Holoscan" "Holo-scan frequency" "H" ":MENU_HOLOSCAN" "" FALSE
addmenu "Move" "Evasion" "Evasion pattern" "E" ":MENU_EVASION" "" FALSE
addmenu "Move" "Attack" "Attack preference" "A" ":MENU_ATTACK" "" FALSE
addmenu "Move" "ExtraSend" "Extra commands" "X" ":MENU_EXTRASEND" "" FALSE

setmenuhelp "Holoscan" "This option determines how often the script will perform holo-scans while it navigates.*There are three settings.**NEVER: The script will navigate using only a density scanner.*STANDARD: The script will use a holo-scanner only if it spots something unusual.*ALWAYS: The script will holo-scan from every sector."
setmenuhelp "Evasion" "This option adjusts the script's hazard evasion pattern.  There are three settings.**STANDARD: If it has any choice, the script will avoid unusual looking sectors.  It will still enter the sector of small groups of enemy fighters.*PARANOID: The script will avoid any possible hazard, including enemy fighters.  If the script has no safe options it will immediately shut down.*RECKLESS: The script performs no hazard checking and will enter any sector in its path."
setmenuhelp "Attack" "This option adjusts how the script behaves in response to enemy fighters.  There are four settings.**STANDARD: The script will destroy any enemy fighters that hang it up when it enters a sector.*RAPID: The script attempt to destroy the fighters as a part of its sector entry - this will make it more resistant to planet-drops.*CRAZY: The script will attempt to destroy fighters in every sector it enters.*PAY TOLLS: The same as standard, although the script will pay toll fighters rather than destroying them."
setmenuhelp "ExtraSend" "This option allows you to configure extra text the script will send before it leaves a sector.  This text can be anything from deploying a group of fighters to destroying a starport."

gosub :SUB_SETMENU
return
:move~menu_holoscan

if ($move~scanholo = 2)
  setvar $move~scanholo 0
else
  add $move~scanholo 1
end
savevar $move~scanholo
gosub :SUB_SETMENU
openmenu "Move"
:move~menu_evasion


if ($move~evasion = 2)
  setvar $move~evasion 0
else
  add $move~evasion 1
end
savevar $move~evasion
gosub :SUB_SETMENU
openmenu "Move"
:move~menu_attack


if ($move~attack = 3)
  setvar $move~attack 0
else
  add $move~attack 1
end
savevar $move~attack
gosub :SUB_SETMENU
openmenu "Move"
:move~menu_extrasend


getinput $move~extrasend "Enter the additional commands/text to be sent on sector entry"
savevar $move~extrasend
replacetext $move~extrasend #42 "*"
gosub :SUB_SETMENU
openmenu "Move"
:move~sub_setmenu


if ($move~scanholo = 0)
  setmenuvalue "Holoscan" "NEVER"
elseif ($move~scanholo = 1)
  setmenuvalue "Holoscan" "STANDARD"
else
  setmenuvalue "Holoscan" "ALWAYS"
end

if ($move~evasion = 0)
  setmenuvalue "Evasion" "STANDARD"
elseif ($move~evasion = 1)
  setmenuvalue "Evasion" "PARANOID"
else
  setmenuvalue "Evasion" "RECKLESS"
end

if ($move~attack = 0)
  setmenuvalue "Attack" "STANDARD"
elseif ($move~attack = 1)
  setmenuvalue "Attack" "FAST"
elseif ($move~attack = 2)
  setmenuvalue "Attack" "CRAZY"
else
  setmenuvalue "Attack" "PAY TOLLS"
end

setmenuvalue "ExtraSend" $move~extrasend

return
