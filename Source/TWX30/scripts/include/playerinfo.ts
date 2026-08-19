:playerinfo~infoquick























































send "/"
setvar $playerinfo~line ""
settextlinetrigger LIBMULTILINE :LINE
pause
:playerinfo~line

getwordpos CURRENTLINE $playerinfo~pos #179
getword CURRENTLINE $playerinfo~test 1

if (($playerinfo~pos = 0) and ($playerinfo~test <> "Ship"))
  if ($playerinfo~line <> "")

    return
  end
  settextlinetrigger LIBMULTILINE :LINE
  pause
end

setvar $playerinfo~line CURRENTLINE
striptext $playerinfo~line ","
replacetext $playerinfo~line #179 " "

setvar $playerinfo~param 1
:playerinfo~next
getword $playerinfo~line $playerinfo~word $playerinfo~param
getword $playerinfo~line $playerinfo~value ($playerinfo~param + 1)

if ($playerinfo~word = 0)
  settextlinetrigger LIBMULTILINE :LINE
  pause
end

if ($playerinfo~word = "Sect")
  setvar $playerinfo~sector $playerinfo~value
elseif ($playerinfo~word = "Turns")
  setvar $playerinfo~turns $playerinfo~value
elseif ($playerinfo~word = "Creds")
  setvar $playerinfo~credits $playerinfo~value
elseif ($playerinfo~word = "Figs")
  setvar $playerinfo~fighters $playerinfo~value
elseif ($playerinfo~word = "Shlds")
  setvar $playerinfo~shields $playerinfo~value
elseif ($playerinfo~word = "Hlds")
  setvar $playerinfo~holds $playerinfo~value
elseif ($playerinfo~word = "Ore")
  setvar $playerinfo~ore $playerinfo~value
elseif ($playerinfo~word = "Org")
  setvar $playerinfo~org $playerinfo~value
elseif ($playerinfo~word = "Equ")
  setvar $playerinfo~equip $playerinfo~value
elseif ($playerinfo~word = "Col")
  setvar $playerinfo~colonists $playerinfo~value
elseif ($playerinfo~word = "Phot")
  setvar $playerinfo~photons $playerinfo~value
elseif ($playerinfo~word = "Armd")
  setvar $playerinfo~mines $playerinfo~value
elseif ($playerinfo~word = "Lmpt")
  setvar $playerinfo~limpets $playerinfo~value
elseif ($playerinfo~word = "GTorp")
  setvar $playerinfo~gentorps $playerinfo~value
elseif ($playerinfo~word = "TWarp")
  if ($playerinfo~value = "No")
    setvar $playerinfo~twarp 0
  else
    setvar $playerinfo~twarp $playerinfo~value
  end
elseif ($playerinfo~word = "Clks")
  setvar $playerinfo~cloaks $playerinfo~value
elseif ($playerinfo~word = "Beacns")
  setvar $playerinfo~beacons $playerinfo~value
elseif ($playerinfo~word = "AtmDt")
  setvar $playerinfo~dets $playerinfo~value
elseif ($playerinfo~word = "Crbo")
  setvar $playerinfo~corbo $playerinfo~value
elseif ($playerinfo~word = "EPrb")
  setvar $playerinfo~probes $playerinfo~value
elseif ($playerinfo~word = "MDis")
  setvar $playerinfo~disruptors $playerinfo~value
elseif ($playerinfo~word = "PsPrb")
  if ($playerinfo~value = "Yes")
    setvar $playerinfo~psiprobe 1
  else
    setvar $playerinfo~psiprobe 0
  end
elseif ($playerinfo~word = "PlScn")
  if ($playerinfo~value = "Yes")
    setvar $playerinfo~planetscanner 1
  else
    setvar $playerinfo~planetscanner 0
  end
elseif ($playerinfo~word = "LRS")
  if ($playerinfo~value = "None")
    setvar $playerinfo~scanner 0
  elseif ($playerinfo~value = "Holo")
    setvar $playerinfo~scanner 2
  else
    setvar $playerinfo~scanner 1
  end
elseif ($playerinfo~word = "Aln")
  setvar $playerinfo~align $playerinfo~value
elseif ($playerinfo~word = "Exp")
  setvar $playerinfo~experience $playerinfo~value
elseif ($playerinfo~word = "Corp")
  setvar $playerinfo~corp $playerinfo~value
elseif ($playerinfo~word = "Ship")
  setvar $playerinfo~ship $playerinfo~value
end

add $playerinfo~param 2
goto :NEXT
