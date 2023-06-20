# Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.

# XBot Command Implementation

:ProcessCmd
  setVar $cmdLabel ":Cmd_" & $Code
  gosub $cmdLabel
  return

# CMD: F1
:Cmd_200
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][1]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F2
:Cmd_201
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][2]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F3
:Cmd_202
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][3]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F4
:Cmd_203
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][4]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F5
:Cmd_204
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][5]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F6
:Cmd_205
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $x SECTOR.WARPS[$curSector][6]
  
  if ($x < 600) or (SECTORS > 5000)
    setVar $x $x & "*"
  end
  
  send $x
  return

# CMD: F7
:Cmd_206
  # bash
  send "ay" $ShipAttack "**"
  return

# CMD: F8
:Cmd_207
  # drop fig macro
  send "f1*ct"
  return

# CMD: F9
:Cmd_208
  # clear and claim sector
  send "at999**f1*cdh1t1*cq*h2t1*cq*"
  return

# CMD: F10
:Cmd_209
  return

# CMD: F11
:Cmd_210
  return

# CMD: F12
:Cmd_211
  return

# CMD: Ctrl+F1
:Cmd_160
  gosub :sub_MarkCmd
  send "ay"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F2
:Cmd_161
  gosub :sub_MarkCmd
  send "any"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F3
:Cmd_162
  gosub :sub_MarkCmd
  send "anny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F4
:Cmd_163
  gosub :sub_MarkCmd
  send "annny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F5
:Cmd_164
  gosub :sub_MarkCmd
  send "annnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F6
:Cmd_165
  gosub :sub_MarkCmd
  send "annnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F7
:Cmd_166
  gosub :sub_MarkCmd
  send "annnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F8
:Cmd_167
  gosub :sub_MarkCmd
  send "annnnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F9
:Cmd_168
  gosub :sub_MarkCmd
  send "annnnnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F10
:Cmd_169
  gosub :sub_MarkCmd
  send "annnnnnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F11
:Cmd_170
  gosub :sub_MarkCmd
  send "annnnnnnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Ctrl+F12
:Cmd_171
  gosub :sub_MarkCmd
  send "annnnnnnnnnnny"
  waitOn "';" & $cmdCount & ":"
  waitOn "<Attack>"
  setTextTrigger missed :capMissed "<Set NavPoint>"
  gosub :Capture~Capture
  killTrigger missed
  return

# CMD: Shift+F1
:Cmd_180
  send "ay" $ShipAttack "**"
  return

# CMD: Shift+F2
:Cmd_181
  send "any" $ShipAttack "**"
  return

# CMD: Shift+F3
:Cmd_182
  send "anny" $ShipAttack "**"
  return

# CMD: Shift+F4
:Cmd_183
  send "annny" $ShipAttack "**"
  return

# CMD: Shift+F5
:Cmd_184
  send "annnny" $ShipAttack "**"
  return

# CMD: Shift+F6
:Cmd_185
  send "annnnny" $ShipAttack "**"
  return

# CMD: Shift+F7
:Cmd_186
  send "annnnnny" $ShipAttack "**"
  return

# CMD: Shift+F8
:Cmd_187
  send "annnnnnny" $ShipAttack "**"
  return

# CMD: Shift+F9
:Cmd_188
  send "annnnnnnny" $ShipAttack "**"
  return

# CMD: Shift+F10
:Cmd_189
  send "annnnnnnnny" $ShipAttack "**"
  return

# CMD: Shift+F11
:Cmd_190
  send "annnnnnnnnny" $ShipAttack "**"
  return

# CMD: Shift+F12
:Cmd_191
  send "annnnnnnnnnny" $ShipAttack "**"
  return

# CMD: Ctrl+A
:Cmd_220
  # planet haggle
return
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  setVar $StealDump~HaggleFactor 9
  gosub :StealDump~sub_SDHaggle
  return

# CMD: Ctrl+B
:Cmd_221
  return

# CMD: Ctrl+C
:Cmd_222
  # Capture macro
  setTextTrigger missed :capMissed "<Set NavPoint>"
  
  getWord CURRENTLINE $CapTest 1
  if ($CapTest = "Attack")
    send "ny"

    gosub :Capture~Capture
  else
    gosub :sub_MarkCmd
    send "ay"
    waitOn "';" & $cmdCount & ":"
    waitOn "<Attack>"
    gosub :Capture~Capture
  end
  
  killTrigger missed
  return

# CMD: Ctrl+D
:Cmd_223
  return

# CMD: Ctrl+E
:Cmd_224
  return

# CMD: Ctrl+F
:Cmd_225
  return

# CMD: Ctrl+G
:Cmd_226
  # Ctrl+G - Re-enter game
  send "qynt***" PASSWORD "**a**"
  return

# CMD: Ctrl+H
:Cmd_227
  # Ctrl+H - Trade at port w/ haggle
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  
  setVar $Haggle~HaggleFactor 5
  getSector $curSector $curSector
  if ($curSector.port.class = 1) or ($curSector.port.class = 5) or ($curSector.port.class = 6) or ($curSector.port.class = 7)
    setVar $Haggle~BuyProd "Equipment"
  elseif ($curSector.port.class = 2) or ($curSector.port.class = 4)
    setVar $Haggle~BuyProd "Organics"
  else
    setVar $Haggle~BuyProd "Fuel"
  end
  send "pt"
  gosub :Haggle~Haggle
  return

# CMD: Ctrl+I
:Cmd_228
  # List AOS
  setVar $i 1
  
  while ($i < SECTORS)
    if ($Cache~AOS[$i] <> "0")
      echo "*Sector: " & $i & "  Type: " & $Cache~AOS[$i]
    end
    
    add $i 1
  end
  
  return

# CMD: Ctrl+J
:Cmd_229
  return

# CMD: Ctrl+K
:Cmd_230
  return

# CMD: Ctrl+L
:Cmd_231
  # Load up photon
  gosub :sub_MarkCmd
  waitOn "';" & $cmdCount & ":"
  
  if ($CurSector < 600) or (SECTORS > 5000)
    send "nsyy  ps h p1*qq" $CurSector "*yy"
  else
    send "nsyy  ps h p1*qq" $CurSector "yy"
  end
  return

# CMD: Ctrl+M
:Cmd_232
  # repeat for each planet in sector
  
  getInput $planetText "Enter text to send to each planet"
  
  if ($planetText = "")
    return
  end
  
  setVar $send ""
  replaceText $planetText #42 "*"
  send "l"
  waitOn "--------------------"
  
  setTextLineTrigger getPlanetID :getPlanetID "<"
  setTextTrigger gotPlanets :gotPlanets "Land on which planet <Q"
  pause
  
  :getPlanetID
  cutText CURRENTLINE $test 1 4
  if ($test = "   <")
    setVar $line CURRENTLINE
    stripText $line "<"
    stripText $line ">"
    getWord $line $id 1
    
    if ($send = "")
      setVar $send $id & "*" & $planetText & "q"
    else
      setVar $send $send & "l" & $id & "*" & $planetText & "q"
    end
  end

  setTextLineTrigger getPlanetID :getPlanetID "<"
  pause
  
  :gotPlanets
  killTrigger getPlanetID
  send $send
  return

# CMD: Ctrl+N
:Cmd_233
  # find nearfig
  if ($Cache~FigCount <= 0)
    clientMessage "No figs cached!"
    return
  end
  echo ANSI_12 "*Nearest fig to sector"
  getConsoleInput $NearFig~Sector
  gosub :NearFig~NearFig
  ClientMessage "Nearest Fig: " & $NearFig~NearFig
  return

# CMD: Ctrl+O
:Cmd_234
  # find nearAOS
  if ($AOSCached = 0)
    clientMessage "No AOS cached!"
    return
  end
  echo ANSI_12 "*Nearest AOS to sector"
  getConsoleInput $sect
  setVar $NearFig~Sector $sect
  gosub :NearFig~NearAOS
  setVar $Cache~AOS $NearFig~NearAOS
  gosub :Cache~GetAOSName
  
  if ($NearFig~NearAOS = 0)
    ClientMessage "No AOS found."
  else
    getDistance $dist $sect $NearFig~NearAOS
    ClientMessage "Nearest AOS: " & $NearFig~NearAOS & " (" & $Cache~AOSName & "), " & $dist & " hops"
  end
  return

# CMD: Ctrl+P
:Cmd_235
  # nuke port macro
  send "pay" $ShipAttack "**"
  return

# CMD: Ctrl+Q
:Cmd_236
  return

# CMD: Ctrl+R
:Cmd_237
  # refresh fig list
  echo ANSI_12 "*Refresh type (" ANSI_15 "A" ANSI_12 "/" ANSI_15 "F" ANSI_12 "): "
  getConsoleInput $refresh SINGLEKEY
  
  setVar $GamePrefs~Bank "XBOT"
  setVar $GamePrefs~ANSI[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs

  if ($refresh = "A") or ($refresh = "a")
    setVar $Cache~CachePorts 1
    gosub :Cache~CacheAOS
    setVar $AOSCached 1
  else
    gosub :Cache~CacheFigs
    setVar $figsCached 1
    clientMessage "We control " & $Cache~FigCount & " sectors." 
  end
  setVar $GamePrefs~Bank "XBOT"
  gosub :GamePrefs~SetGamePrefs
  return

# CMD: Ctrl+S
:Cmd_238
  # Ctrl+S - Holoscan->Photon
  gosub :sub_MarkCmd

  send "sh"
  waitOn "';" & $cmdCount & ":"
  
  waitOn "Select (H)olo Scan"
  setTextLineTrigger getHoloSector :getHoloSector "Sector  : "
  setTextLineTrigger getTrader :getTrader "Traders : "
  setTextLineTrigger noTrader :noTrader "Warps to Sector(s)"
  pause
  :getHoloSector
  getWord CURRENTLINE $holoSector 3
  setTextLineTrigger getHoloSector :getHoloSector "Sector  : "
  pause
  
  :getTrader
  send "cpy" $holoSector "*qsh"
  
  :noTrader
  killTrigger getHoloSector
  killTrigger getTrader    
  killTrigger noTrader
  return

# CMD: Ctrl+T
:Cmd_239
  # Ctrl+T - Trade at port
  send "pt****"
  return

# CMD: Ctrl+U
:Cmd_240
  return

# CMD: Ctrl+V
:Cmd_241
  # variable macro
  getInput $vars "Enter variables"
  getInput $text "Enter macro (@ denotes variable)"
  getInput $init "Enter init (blank for none)"
  
  if ($init = "") or ($init = 0)
    setVar $send ""
  else
    setVar $send $init
  end
    
  replaceText $text #42 "*"
  setVar $i 1
  getWord $vars $var $i
  while ($var <> 0)
    setVar $val $text
    replaceText $val "@" $var
    setVar $send $send & $val
    add $i 1
    getWord $vars $var $i
  end
  
  if ($send <> "")
    send $send
  end
  
  return

# CMD: Ctrl+W
:Cmd_242
  # Surround sector
  echo ANSI_12 "*Surround type (" ANSI_15 "O" ANSI_12 "/" ANSI_15 "D" ANSI_12 "/" ANSI_15 "T" ANSI_12 "/" ANSI_15 "M" ANSI_12 "/" ANSI_15 "L" ANSI_12 "): "
  getConsoleInput $surround SINGLEKEY
  
  if ($surround = "M") or ($surround = "m") or ($surround = "l") or ($surround = "L")
    if ($surround = "M") or ($surround = "m")
      getInput $surroundSend "Enter surround text"
    end
    
    if ($surroundSend = "")
      return
    end
    
    setVar $surround "M"
    replaceText $surroundSend #42 "*"
  end
  
  setVar $i 1
  setVar $send ""
  
  while ($i <= SECTOR.WARPCOUNT[$curSector])
    setVar $s SECTOR.WARPS[$curSector][$i]
    
    if (((SECTOR.FIGS.OWNER[$s] <> "belong to your Corp") and (SECTOR.FIGS.OWNER[$s] <> "yours")) or ($surround = "M")) and ($s > 10) and (PORT.CLASS[$s] <> 9)
      if ($s < 600) or (SECTORS > 5000)
        setVar $s $s & "*"
      end
      
      if ($surround = "M")
        setVar $send $send & $s & "at999**" & $surroundSend & "<"
      else
        setVar $send $send & $s & "at999**f1*c" & $surround & "<"
      end
    end
  
    add $i 1
  end
  
  send $send
  return

# CMD: Ctrl+X
:Cmd_243
  return

# CMD: Ctrl+Y
:Cmd_244
  return

# CMD: Ctrl+Z
:Cmd_245
  # Fast PPT
  send "pt****<"
  return

# CMD: Insert
:Cmd_172
  # lock unmanned ship in tow
  gosub :sub_MarkCmd
  send "wn"
  waitOn "';" & $cmdCount & ":"
  waitOn "Which ship do you want to tow?"
  waitOn "--------------"
  setTextLineTrigger lockUnmannedShip :lockUnmannedship
  pause
  :lockUnmannedShip
  getWord CURRENTLINE $shipID 1
  if ($shipID <> "You")
    send $shipID "*"
  end
  return

# CMD: Home
:Cmd_173
  return

# CMD: Delete
:Cmd_174
  return

# CMD: End
:Cmd_175
  return

# CMD: PageUp
:Cmd_176
  # lock manned corp ship in tow
  gosub :sub_MarkCmd
  send "tfyf"
  waitOn "';" & $cmdCount & ":"
  
  setTextLineTrigger transferFailed :pickupFailed "Your Associate must be in the same sector"
  setTextLineTrigger getTransferFigs :getTransferFigs "You have "
  pause
  
  :getTransferFigs
  killTrigger transferFailed
  getText CURRENTLINE $transferName "fighters, and " " has "
  getText CURRENTLINE $transferFigs " has " "."
  send $transferFigs "**wy" $transferName "*"

  :pickupFailed
  send "*"
  killTrigger getTransferFigs
  
  return

# CMD: PageDown
:Cmd_177
  # transfer figs back and unlock tow
  send "tfyt" $transferFigs "**w"
  return

# CMD: LeftArrow
:Cmd_178
  return

# CMD: RightArrow
:Cmd_179
  return

# CMD: UpArrow
:Cmd_246
  return

# CMD: DownArrow
:Cmd_247
  return

# CMD: KeyPad1
:Cmd_248
  return

# CMD: KeyPad2
:Cmd_249
  return

# CMD: KeyPad3
:Cmd_250
  return

# CMD: KeyPad4
:Cmd_251
  return

# CMD: KeyPad5
:Cmd_252
  return

# CMD: KeyPad6
:Cmd_253
  return

# CMD: KeyPad7
:Cmd_254
  return

# CMD: KeyPad8
:Cmd_128
  return

# CMD: KeyPad9
:Cmd_129
  return

# CMD: KeyPad0
:Cmd_130
  return

# CMD: KeyPadDel
:Cmd_131
  return


:Sub_MarkCmd
  setVar $backSpace ""
  if ($cmdCount >= 99)
    setVar $cmdCount 0
  else
    add $cmdCount 1
  end
  getLength $cmdCount $len
  
  while ($len > "-3")
    setVar $backSpace $backspace & #8
    subtract $len 1
  end
  
  send "';" $cmdCount ":" $backSpace
  return
  

:capMissed
  send "*"
  pause


# includes:
include "include\cache"
include "include\nearFig"
include "include\gamePrefs"
include "include\haggle"
