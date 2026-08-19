:player~currentprompt













































































































































































































settexttrigger PROMPT :ALLPROMPTSCATCH #145&#8
setdelaytrigger PROMPT_DELAY :CURRENT_PROMPT_DELAY 5000
send #145
pause
:player~current_prompt_delay
settextouttrigger ATKEYS :CURRENT_PROMPT_AT_KEYS
setdelaytrigger PROMPT_DELAY :VERIFYDELAY 30000
pause
:player~current_prompt_at_keys
getouttext $player~out
send $player~out
killtrigger PROMPT_DELAY
return
:player~allpromptscatch
killtrigger PROMPT_DELAY
gosub :PARSE_CURRENT_PROMPT_LINE
setvar $player~startinglocation $player~current_prompt
return
:player~parse_current_prompt_line



setvar $player~ansiline CURRENTANSILINE
setvar $player~self_destruct_prompt FALSE
getwordpos $player~ansiline $player~pos "ARE YOU SURE CAPTAIN? (Y/N) [N]"
if ($player~pos > 0)
  setvar $player~self_destruct_prompt TRUE
end
setvar $player~full_current_prompt CURRENTLINE
striptext $player~full_current_prompt #145
striptext $player~full_current_prompt #8
getword $player~full_current_prompt $player~current_prompt 1
if ($player~current_prompt = 0)
  setvar $player~full_current_prompt CURRENTANSILINE
  striptext $player~full_current_prompt #145
  striptext $player~full_current_prompt #8
  getword $player~full_current_prompt $player~current_prompt 1
end
striptext $player~current_prompt #145
striptext $player~current_prompt #8
return
:player~verifydelay

killalltriggers
disconnect
:player~findjumpsector



setvar $player~red_adj 0
if ($player~startinglocation = "Citadel")
  send "qt*t1*q* "
else
  send "qq* "
end

setvar $player~k 1
while (SECTOR.BACKDOORS[$player~target][$player~k] > 0)
  setvar $player~red_adj SECTOR.BACKDOORS[$player~target][$player~k]
  gosub :TEST_RED_SECTOR
  if ($player~foundsector = TRUE)
    goto :SECTORLOCKED
  end
  add $player~k 1
end

setvar $player~i 1
while (SECTOR.WARPSIN[$player~target][$player~i] > 0)
  setvar $player~red_adj SECTOR.WARPSIN[$player~target][$player~i]
  gosub :TEST_RED_SECTOR
  if ($player~foundsector = TRUE)
    goto :SECTORLOCKED
  end
  add $player~i 1
end
:player~noadjsfound

setvar $player~red_adj 0
return
:player~sectorlocked

if ($player~target = $map~stardock)
  setvar $map~backdoor $player~red_adj
  savevar $map~backdoor
end
return
:player~test_red_sector




setvar $player~foundsector FALSE
send "m "&$player~red_adj&"* y"
settexttrigger TWARPBLIND :TWARPBLIND "Do you want to make this jump blind? "
settexttrigger TWARPLOCKED :TWARPLOCKED "All Systems Ready, shall we engage? "
settextlinetrigger TWARPVOIDED :TWARPVOIDED "Danger Warning Overridden"
settextlinetrigger TWARPADJ :TWARPADJ "<Set NavPoint>"
pause
:player~twarpadj
gosub :KILLFINDJUMPSECTORS
send " * "
return
:player~twarpvoided

gosub :KILLFINDJUMPSECTORS
send " N N "
return
:player~twarplocked

gosub :KILLFINDJUMPSECTORS
send " * "
setvar $player~foundsector TRUE
return
:player~twarpblind

gosub :KILLFINDJUMPSECTORS
send " N "
return
:player~killfindjumpsectors

killtrigger TWARPBLIND
killtrigger TWARPLOCKED
killtrigger TWARPVOIDED
killtrigger TWARPADJ
return
:player~getinfo

































setvar $player~noflip TRUE
setvar $player~photons 0
setvar $player~towed ""
setvar $player~scan_type "None"
setvar $player~twarp_type 0
setvar $player~corpstring "[0]"
setvar $player~igstat 0
:player~waitoninfo
send "?"
waiton "<!>"
settextlinetrigger GETINFO_CN9_CHECK_1 :GETINFO_CN9_CHECK "<N> Interdictor Control"
settextlinetrigger GETINFO_CN9_CHECK_2 :GETINFO_CN9_CHECK "<N> Move to NavPoint"
settextlinetrigger GETTRADERNAME :GETTRADERNAME "Trader Name    :"
settextlinetrigger GETEXPANDALIGN :GETEXPANDALIGN "Rank and Exp"
settextlinetrigger GETCORP :GETCORP "Corp           #"
settextlinetrigger GETSHIPTYPE :GETSHIPTYPE "Ship Info      :"
settextlinetrigger GETTPW :GETTPW "Turns to Warp  :"
settextlinetrigger GETSECT :GETSECT "Current Sector :"
settextlinetrigger GETTURNS :GETTURNS "Turns left"
settextlinetrigger GETTOW :GETTOW "Tractor Beam   : ON, towing "
settextlinetrigger GETHOLDS :GETHOLDS "Total Holds"
settextlinetrigger GETFIGHTERS :GETFIGHTERS "Fighters       :"
settextlinetrigger GETSHIELDS :GETSHIELDS "Shield points  :"
settextlinetrigger GETPHOTONS :GETPHOTONS "Photon Missiles:"
settextlinetrigger GETSCANTYPE :GETSCANTYPE "LongRange Scan :"
settextlinetrigger GETTWARPTYPE1 :GETTWARPTYPE1 "  (Type 1 Jump):"
settextlinetrigger GETTWARPTYPE2 :GETTWARPTYPE2 "  (Type 2 Jump):"
settextlinetrigger GETCREDITS :GETCREDITS "Credits"
settextlinetrigger CHECKIG :CHECKIG "Interdictor ON :"
send "i"
pause
:player~getinfo_cn9_check
setvar $player~noflip TRUE
pause
:player~gettradername
killtrigger GETINFO_CN9_CHECK_1
killtrigger GETINFO_CN9_CHECK_2
setvar $player~trader_name CURRENTLINE
striptext $player~trader_name "Trader Name    : "
setvar $player~i 1
while ($player~i <= $player~rankslength)
  setvar $player~temp $player~ranks[$player~i]
  striptext $player~temp "31m"
  striptext $player~temp "36m"
  striptext $player~trader_name $player~temp&" "
  add $player~i 1
end
pause
:player~gettow
setvar $player~line CURRENTLINE&"<<|END|>>"
gettext $player~line $player~towed "Tractor Beam   : ON, towing " "<<|END|>>"
pause
:player~getexpandalign
getword CURRENTLINE $player~experience 5
getword CURRENTLINE $player~alignment 7
striptext $player~experience ","
striptext $player~alignment ","
striptext $player~alignment "Alignment="
pause
:player~getcorp
getword CURRENTLINE $player~corp 3
striptext $player~corp ","
setvar $player~corpstring "["&$player~corp&"]"
pause
:player~getshiptype
getwordpos CURRENTLINE $player~shiptypeend "Ported="
subtract $player~shiptypeend 18
cuttext CURRENTLINE $player~ship_type_long 18 $player~shiptypeend
pause
:player~gettpw
getword CURRENTLINE $player~turns_per_warp 5
pause
:player~getsect
getword CURRENTLINE $player~current_sector 4
pause
:player~getturns
getword CURRENTLINE $player~turns 4
if ($player~turns = "Unlimited")
  setvar $player~turns 65000
  setvar $player~unlimitedgame TRUE
end
savevar $player~unlimitedgame
pause
:player~getholds
setvar $player~temp CURRENTLINE&" "
gettext $player~temp $player~ore_holds "Ore=" " "
if ($player~ore_holds = "")
  setvar $player~ore_holds 0
end
gettext $player~temp $player~organic_holds "Organics=" " "
if ($player~organic_holds = "")
  setvar $player~organic_holds 0
end
gettext $player~temp $player~equipment_holds "Equipment=" " "
if ($player~equipment_holds = "")
  setvar $player~equipment_holds 0
end
gettext $player~temp $player~colonist_holds "Colonists=" " "
if ($player~colonist_holds = "")
  setvar $player~colonist_holds 0
end
gettext $player~temp $player~empty_holds "Empty=" " "
if ($player~empty_holds = "")
  setvar $player~empty_holds 0
end
pause
:player~getfighters
getword CURRENTLINE $player~fighters 3
striptext $player~fighters ","
pause
:player~getshields
getword CURRENTLINE $player~shields 4
striptext $player~shields ","
pause
:player~getphotons
getword CURRENTLINE $player~photons 3
pause
:player~getscantype
getword CURRENTLINE $player~scan_type 4
pause
:player~gettwarptype1
getword CURRENTLINE $player~twarp_1_range 4
setvar $player~twarp_type 1
pause
:player~gettwarptype2
getword CURRENTLINE $player~twarp_2_range 4
setvar $player~twarp_type 2
pause
:player~checkig
getword CURRENTLINE $player~igstat 4
pause
:player~getcredits
getword CURRENTLINE $player~credits 3
striptext $player~credits ","
if ($player~igstat = 0)
  setvar $player~igstat "NO IG"
end
:player~getinfodone
killtrigger GETEXPANDALIGN
killtrigger GETCORP
killtrigger GETSHIPTYPE
killtrigger GETTPW
killtrigger GETTOW
killtrigger GETSECT
killtrigger GETTURNS
killtrigger GETHOLDS
killtrigger GETFIGHTERS
killtrigger GETSHIELDS
killtrigger GETPHOTONS
killtrigger GETSCANTYPE
killtrigger GETTWARPTYPE1
killtrigger GETTWARPTYPE2
killtrigger GETCREDITS
killtrigger CHECKIG
killtrigger GETINFODONE
killtrigger GETINFODONE2
killtrigger GETINFO_CN9_CHECK_1
killtrigger GETINFO_CN9_CHECK_2

savevar $player~unlimitedgame

if ($player~save)

  savevar $player~credits
  savevar $player~fighters
  savevar $player~shields
  savevar $player~total_holds
  savevar $player~ore_holds
  savevar $player~organic_holds
  savevar $player~equipment_holds
  savevar $player~colonist_holds
  savevar $player~photons
  savevar $player~armids
  savevar $player~limpets
  savevar $player~genesis
  savevar $player~twarp_type
  savevar $player~cloaks
  savevar $player~beacons
  savevar $player~atomic
  savevar $player~corbo
  savevar $player~eprobes
  savevar $player~mine_disruptors
  savevar $player~psychic_probe
  savevar $player~planet_scanner
  savevar $player~scan_type
  savevar $player~alignment
  savevar $player~experience
  savevar $player~ship_number
  savevar $player~trader_name
end
return
:player~quikstats
















































































































































































setvar $player~current_prompt "Undefined"
setvar $player~quikstats_retry 0
if ($player~towed = 0)
  setvar $player~towed ""
end
loadvar $player~unlimitedgame
:player~trypromptagain
killtrigger TOOLONGPROMPT
killtrigger NOPROMPT
killtrigger PROMPT
killtrigger STATLINETRIG
killtrigger GETLINE2
settextlinetrigger PROMPT :ALLPROMPTS #145&#8
settextlinetrigger STATLINETRIG :STATSTART #179
setdelaytrigger TOOLONGPROMPT :TRYPROMPTAGAIN 10000
send #145&"/"
pause
:player~allprompts
gosub :PARSE_CURRENT_PROMPT_LINE
settextlinetrigger PROMPT :ALLPROMPTS #145&#8
pause
:player~statstart
killtrigger PROMPT
setvar $player~stats ""
setvar $player~wordy ""
:player~statsline
killtrigger STATLINETRIG
killtrigger GETLINE2
setvar $player~line2 CURRENTLINE
replacetext $player~line2 #179 " "
striptext $player~line2 ","
setvar $player~stats $player~stats&$player~line2
getwordpos $player~line2 $player~pos "Ship"
if ($player~pos > 0)
  goto :GOTSTATS
end
settextlinetrigger GETLINE2 :STATSLINE
pause
:player~gotstats

killtrigger TOOLONGPROMPT
killtrigger GETLINE2
setvar $player~stats $player~stats&" @@@"
getwordpos $player~stats $player~pos "Sect "
while ($player~pos = 0)
  add $player~quikstats_retry 1
  if ($player~quikstats_retry <= 3)
    goto :TRYPROMPTAGAIN
  end
end
getwordpos $player~stats $player~pos "Figs "
if ($player~pos = 0)
  add $player~quikstats_retry 1
  if ($player~quikstats_retry <= 3)
    goto :TRYPROMPTAGAIN
  end
end
setvar $player~current_word 1
getword $player~stats $player~wordy $player~current_word
:player~parsestats
if ($player~wordy <> "@@@")
  if ($player~wordy = "Sect")
    getword $player~stats $player~current_sector ($player~current_word + 1)
  elseif ($player~wordy = "Turns")
    getword $player~stats $player~turns ($player~current_word + 1)
    if ($player~unlimitedgame = TRUE)
      setvar $player~turns 65000
    end
  elseif ($player~wordy = "Creds")
    getword $player~stats $player~credits ($player~current_word + 1)
  elseif ($player~wordy = "Figs")
    getword $player~stats $player~fighters ($player~current_word + 1)
    savevar $player~fighters
  elseif ($player~wordy = "Shlds")
    getword $player~stats $player~shields ($player~current_word + 1)
    savevar $player~shields
  elseif ($player~wordy = "Hlds")
    getword $player~stats $player~total_holds ($player~current_word + 1)
  elseif ($player~wordy = "Ore")
    getword $player~stats $player~ore_holds ($player~current_word + 1)
  elseif ($player~wordy = "Org")
    getword $player~stats $player~organic_holds ($player~current_word + 1)
  elseif ($player~wordy = "Equ")
    getword $player~stats $player~equipment_holds ($player~current_word + 1)
  elseif ($player~wordy = "Col")
    getword $player~stats $player~colonist_holds ($player~current_word + 1)
  elseif ($player~wordy = "Phot")
    getword $player~stats $player~photons ($player~current_word + 1)
  elseif ($player~wordy = "Armd")
    getword $player~stats $player~armids ($player~current_word + 1)
  elseif ($player~wordy = "Lmpt")
    getword $player~stats $player~limpets ($player~current_word + 1)
  elseif ($player~wordy = "GTorp")
    getword $player~stats $player~genesis ($player~current_word + 1)
  elseif ($player~wordy = "TWarp")
    getword $player~stats $player~twarp_type ($player~current_word + 1)
  elseif ($player~wordy = "Clks")
    getword $player~stats $player~cloaks ($player~current_word + 1)
  elseif ($player~wordy = "Beacns")
    getword $player~stats $player~beacons ($player~current_word + 1)
  elseif ($player~wordy = "AtmDt")
    getword $player~stats $player~atomic ($player~current_word + 1)
  elseif ($player~wordy = "Corbo")
    getword $player~stats $player~corbo ($player~current_word + 1)
  elseif ($player~wordy = "EPrb")
    getword $player~stats $player~eprobes ($player~current_word + 1)
  elseif ($player~wordy = "MDis")
    getword $player~stats $player~mine_disruptors ($player~current_word + 1)
  elseif ($player~wordy = "PsPrb")
    getword $player~stats $player~psychic_probe ($player~current_word + 1)
  elseif ($player~wordy = "PlScn")
    getword $player~stats $player~planet_scanner ($player~current_word + 1)
  elseif ($player~wordy = "LRS")
    getword $player~stats $player~scan_type ($player~current_word + 1)
  elseif ($player~wordy = "Aln")
    getword $player~stats $player~alignment ($player~current_word + 1)
  elseif ($player~wordy = "Exp")
    getword $player~stats $player~experience ($player~current_word + 1)
  elseif ($player~wordy = "Corp")
    getword $player~stats $player~corp ($player~current_word + 1)
    setvar $player~corpnumber $player~corp
    savevar $player~corpnumber
  elseif ($player~wordy = "Ship")
    getword $player~stats $player~ship_number ($player~current_word + 1)
    getword $player~stats $player~ship_type ($player~current_word + 2)
  end
  add $player~current_word 1
  getword $player~stats $player~wordy $player~current_word
  goto :PARSESTATS
end
if ($player~current_prompt = "Undefined")
  settextlinetrigger PROMPTAFTERSTATS :PROMPTAFTERSTATS #145&#8
  setdelaytrigger NOPROMPT :NOPROMPT 1000
  pause
end
goto :DONEQUIKSTATS
:player~promptafterstats
killtrigger NOPROMPT
gosub :PARSE_CURRENT_PROMPT_LINE
goto :DONEQUIKSTATS
:player~noprompt
killtrigger PROMPTAFTERSTATS
goto :DONEQUIKSTATS
:player~donequikstats
killtrigger STATLINETRIG
killtrigger GETLINE2
killtrigger PROMPT
savevar $player~unlimitedgame
if ($player~save)
  savevar $player~corp
  savevar $player~credits
  savevar $player~current_sector
  savevar $player~turns
  savevar $player~fighters
  savevar $player~shields
  savevar $player~total_holds
  savevar $player~ore_holds
  savevar $player~organic_holds
  savevar $player~equipment_holds
  savevar $player~colonist_holds
  savevar $player~photons
  savevar $player~armids
  savevar $player~limpets
  savevar $player~genesis
  savevar $player~twarp_type
  savevar $player~cloaks
  savevar $player~beacons
  savevar $player~atomic
  savevar $player~corbo
  savevar $player~eprobes
  savevar $player~mine_disruptors
  savevar $player~psychic_probe
  savevar $player~planet_scanner
  savevar $player~scan_type
  savevar $player~alignment
  savevar $player~experience
  savevar $player~ship_number
  savevar $player~trader_name
end
return
:player~startcnsettings






























































send "CN"
settextlinetrigger ANSI1 :CNCHECK "(1) ANSI graphics            - Off"
settextlinetrigger ANIM1 :CNCHECK "(2) Animation display        - On"
settextlinetrigger PAGE1 :CNCHECK "(3) Page on messages         - On"
settextlinetrigger SETSSCHN :SETSSCHN "(4) Sub-space radio channel"
settextlinetrigger SILENCE1 :CNCHECK "(7) Silence ALL messages     - Yes"
settextlinetrigger ABORTDISPLAY1 :CNCHECK "(9) Abort display on keys    - ALL KEYS"
settextlinetrigger MESSAGEDISPLAY1 :CNCHECK "(A) Message Display Mode     - Long"
settextlinetrigger SCREENPAUSES1 :CNCHECK "(B) Screen Pauses            - Yes"
settextlinetrigger ONLINEAUTOFLEE0 :CNCDONE "(C) Online Auto Flee         - Off"
settextlinetrigger ONLINEAUTOFLEE1 :CNCALMOSTDONE "(C) Online Auto Flee         - On"
pause
:player~cncheck
gosub :GETCNC
pause
:player~setsschn
getword CURRENTLINE $bot~subspace 6
if ($bot~subspace = 0)
  getrnd $bot~subspace 101 60000
  send 4&$bot~subspace&"*"
end
savevar $bot~subspace
pause
:player~cncalmostdone
gosub :GETCNC
:player~cncdone
send "QQ"
killtrigger 1
killtrigger 2
settexttrigger 1 :SUBSTARTCNCONTINUE "Command [TL="
settexttrigger 2 :SUBSTARTCNCONTINUE "Citadel command (?=help)"
pause
:player~substartcncontinue
killtrigger 1
killtrigger 2
return
:player~getcnc

getword CURRENTLINE $player~cnc 1
striptext $player~cnc "("
striptext $player~cnc ")"
send $player~cnc&"  "
return
