# QuickDraw 3.0 by p][x

# 0 : Report class 0 locations via Subspace, or ask for them if needed.
# 1 : TWarp to NavPoint 1.
# 2 : TWarp to NavPoint 2.
# 3 : TWarp to NavPoint 3.
# 4 : TWarp to NavPoint 4.
#     Notes: WARNING - Script checks TWX database to ensure that you
#            have figs in the NavPoint sector but if the database is
#            wrong, the script may blind warp.
# 5 : Bust 5 planets Quick.
# 9 : Change of your CN9 setting.
# A : Scan current sector, and surrounding if you have holo/density.
# B : Bribe the Grimy Trader.
# C : Transfer credits via the bank.
#     Notes: Must be run by both the sender and the reciever.
#            Receiver must start script first.
# G : Relogon.
# H : Create 100% navhaz in current sector.
#     Notes: Must have 10 GTorps and 10 ADets
# J : Jump between Terra/Sol or Planet/Planet.
#     Notes: Works in same sector only.
# L : Cluster scan, holoscans all surrounding sectors
#     Notes: Only goes into sectors that are safe.
# M : Mow to desired sector.
#     Notes: Lays figs along its path accept for the first warp.
#            This is so you can move out faster in case theres a
#            photon following behind you. Also, will not lay
#            figs where you already have them along your path.
# R : Surround current sector.
# S : TWarp to NavPoint StarDock.
# T : TWarp to NavPoint Terra.
# U : Burst commands.
# X : Transport to another ship.
# Y : Set NavPoint.
# Ideas!!!!!

getword CURRENTLINE $prompt 1
getconsoleinput $menu SINGLEKEY
uppercase $menu

# -----Send class 0's over subspace or ask for them----------------------------
if ($menu = 0)
    gosub :class0
    if ($var = 0)
        echo ansi_14 "** Where is Alpha Centauri? "
        getconsoleinput $alpha
        setvar $alpha "Alpha Centauri: " & $alpha
        write $file $alpha
        echo ansi_14 "** Where is Rylos? "
        getconsoleinput $rylos
        setvar $rylos "Rylos: " & $rylos
        write $file $rylos
    end
    send "'*" $alpha "*"
    send $rylos "**"

# -TWarp to navpoint-----------------------------------------------------------
elseif ($menu = 1) or ($menu = 2) or ($menu = 3) or ($menu = 4) or ($menu = "T") or ($menu = "S")
    gosub :quickStats
    if ($menu = "T") or ($menu = "S") and ($aln < 1000)
        echo ansi_14 "** Quickdraw: " ansi_12 " Negative aligned players cannot TWarp to Fed space."
        halt
    end
    if ($prompt <> "Command")
        send "q"
    end
    send "nq"
    settextlinetrigger 1 :checkNav "(" & $menu & ")"
    settextlinetrigger 2 :noNav "Choose NavPoint (?=Help) [Q] : Q"
    pause
    :checkNav
        cuttext CURRENTLINE $var 20 99
        striptext $var " "
        setvar $var2 SECTOR.FIGS.OWNER[$sect]
        if ($var = "(NotScanning)")
            gosub :land
            send "^q"
            waitfor ": ENDINTERROG"
            :noNav
                echo ansi_14 "** Quickdraw: " ansi_12 "That NavPoint is unavailable."
            halt
        end
     getword CURRENTLINE $sect 4
     send "n " $menu "y y "
    if ($sect = 1)
        setvar $prompt "Do"
        gosub :land
    elseif ($sect = STARDOCK)
        setvar $prompt "<StarDock>"
        gosub :land
    end

# -Bust 5 planets from StarDock, MUST have 5 GTorps and ADets to start---------
elseif ($menu = 5)
    if ($prompt <> "<StarDock>")
        echo ansi_14 "** Quickdraw: " ansi_12 "You can only run this from the StarDock"
        halt
    end
    gosub :quickstats
    if ($gtorp < 5) or ($atmdt < 5)
        echo ansi_14 "** Quickdraw: " ansi_12 "You must have 5 GTorps and Detonators."
        halt
    end
    getsector STARDOCK $var
    setvar $var 0
    send "q"
    if ($var.PLANETS <> 0) or ($plscn = "Yes")
        :smart5
          while ($var < 5)
          getrnd $rnd 1000 9999
          send "uy QuickDraw: " $rnd "*p * l"
          waitfor "<Atmospheric maneuvering system engaged>"
          settextlinetrigger 1 :bustit "QuickDraw: " & $rnd
          pause
          :bustit
            getword CURRENTLINE $planet 2
            striptext $planet ">"
            send $planet "* z dy "
            add $var 1
          end
    else
        :quick5
          while ($var < 5)
              getrnd $rnd 1000 9999
              send "uy QuickDraw: " $rnd "*p * l z dy "
              add $var 1
          end
    end
    gosub :land
    setvar $var (75 * 5)
    add $exp $var
    send "h a 5*t 5* q"
    waitfor "How many Genesis Torpedoes"
    settextlinetrigger 1 :5creds "You have "
    pause
    :5creds
        getword CURRENTLINE $creds 3
    echo ansi_14 "********** Quickdraw: " ansi_6 "You have " ansi_14 $exp ansi_6 " experience points and " ansi_14 $creds ansi_6 " credits."

# -Change current CN9 setting to opposite of what it is------------------------
elseif ($menu = 9)
    gosub :quickStats
    if ($prompt = "Planet")
        gosub :planetNumber
        gosub :planetCount
    end
    if ($prompt <> "Command")
        send "q "
    end
    send "c n 9 q q "
    if ($prompt <> "Command")
        gosub :land
    end

# -Holo/density scan or display only from terra, other planets, dock, class 0's
elseif ($menu = "A")
    if ($prompt <> "<StarDock>") and ($prompt <> "Planet") and ($prompt <> "Do") and ($prompt <> "Which") and ($prompt <> "Command") and ($prompt <> "Citadel")
        echo ansi_14 "** Quickdraw: " ansi_12 "Cannot run a scan from here"
        halt
    end
    if ($prompt = "Citadel")
        send "q"
    end
    gosub :quickStats
    if ($prompt = "Planet") or ($prompt = "Citadel")
        gosub :planetNumber
        gosub :planetCount
    end
    if ($prompt <> "Command")
        send "q"
    end
    if ($lrs = "Holo")
        send "s ds h"
    elseif ($lrs = "Dens")
        send "s"
    else
        send "d"
    end
    if ($prompt <> "Command")
        gosub :land
    end

# -----Bribe the Grimy Trader--------------------------------------------------
elseif ($menu = "B")
    if ($prompt <> "<StarDock>")
        echo ansi_14 "** Quickdraw: " ansi_12 "You can not run this from here"
        halt
    end
    gosub :quickstats
    if ($creds < 200000)
        echo ansi_12 "** You need at least 200,000 credits to bribe."
        halt
    end
    :who
      echo ansi_14 "** Type the persons name exactly, type ? to lookup names "
      getconsoleinput $var
      if ($var = "?")
          send "qclvqp s "
          waitfor "<StarDock> Where to? (?=Help)"
          goto :who
      end
    send "t t bribe*200000*trader*yy" $var "*y*q"
    settextlinetrigger 1 :bribe "Hmmm, I ain't gettin nothin"
    settextlinetrigger 2 :bribe "That trader docked at "
    pause
    :bribe
      setvar $line CURRENTLINE
      striptext $line #34
    waitfor "You make a hasty exit from the Tavern."
    echo ansi_14 "*" $line
    send "^q"

# -----Transfer money via the bank---------------------------------------------
elseif ($menu = "C")
    if ($prompt <> "<StarDock>")
        echo ansi_12 "** You can not run this from here."
        halt
    end
    echo ansi_12 "** S" ansi_14 "end or " ansi_12 "R" ansi_14 "eceive credits? "
    getconsoleinput $var SINGLEKEY
    uppercase $var
    send "g"
    if ($var = "R")
        :withdraw
          settextlinetrigger 1 :drawtake "credits to your Galactic bank account."
          settextlinetrigger 2 :drawdone "QuickDraw: transfer complete"
          pause
          :drawtake
            killtrigger 2
            send "w*'QuickDraw: credits withdrawn*"
            goto :withdraw
          :drawdone
            killtrigger 1
            send "w*q"
            halt
    elseif ($var = "S")
        gosub :quickstats
        send "#"
        waitfor "Who's Playing"
        waitfor "<Galactic Bank>"
        echo ansi_14 "** Who would you like to send to? (exact name) "
        getconsoleinput $who
        echo ansi_14 "** How much would you like to send? (ENTER for all) "
        getconsoleinput $send
        if ($send = "") or ($send > $creds)
            setvar $send $creds
        end
        send "w*"
        :deposit
          send "d"
          if ($send < 500000)
              send $send "*"
          else
              send "*"
          end
          send "t" $who "**"
          if ($send < 500000)
              send "'QuickDraw: transfer complete*q"
              halt
          else
              subtract $send 500000
          end
          waitfor "QuickDraw: credits withdrawn"
          goto :deposit
    end

# -----Re-log on---------------------------------------------------------------
elseif ($menu = "G")
    if ($prompt <> "Command")
        echo ansi_12 "** You can only use re-log on from the Command prompt."
        halt
    end
    send "qy t* * * " PASSWORD "* *a* "

# -----Create 100% Navhaz in current sector------------------------------------
elseif ($menu = "H")
    if ($prompt <> "Command")
        echo ansi_12 "** You can only create navhaz fromt he Command prompt."
        halt
    end
    gosub :quickStats
    if ($gtorp < 10) or ($atmdt < 10)
        echo ansi_12 "** You do not have enough GTorps and/or ADets."
        halt
    end
    setvar $var ($figs + $shlds)
    if ($var < 5501)
        echo ansi_12 "** WARNING: " ansi_14 "You are dangerously low on figs/shilds. Continue? "
        getconsoleinput $menu SINGLEKEY
        uppercase $menu
        if ($menu <> "Y")
            halt
        end
    end
    send "v"
    waitfor ",  Traders on a Corp:"
    gettext CURRENTLINE $var2 "sector: " ",  T"
    setvar $var 1
    while ($var < 11)
        send "uy"
        if ($var > $var2)
            send "n"
        end
        send " Quickdraw: NavHaz*"
        if ($corp <> 0)
            send "c"
        end
        add $var 1
    end
    send "zn"
    waitfor "Do you want instructions (Y/N) [N]? No"
    while ($var > 0)
        send "l"
            settexttrigger 1 :getHaz "Quickdraw: NavHaz"
            settexttrigger 2 :gotHaz "Landing sequence engaged..."
            pause
            :getHaz
                killtrigger 2
                gettext CURRENTLINE $var2 " <" "> "
                send $var2 "* "
            :gotHaz
                killtrigger 1
        send "z dy "
        subtract $var 1
    end

# -Jump between Terra and Sol or planet to planet------------------------------
elseif ($menu = "J")
    if ($prompt <> "Which") and ($prompt <> "Do") and ($prompt <> "Planet")
        echo ansi_14 "** Quickdraw: " ansi_12 "Cannot make a jump from here"
        halt
    end
    gosub :quickStats
    if ($prompt = "Planet")
        echo ansi_14 "** Enter the planet number you want to jump to "
        getconsoleinput $planetjump
        gosub :planetNumber
        setvar $var $planet
        setvar $planet $planetjump
    elseif ($prompt = "Do")
        setvar $prompt "Which"
    elseif ($prompt = "Which")
        setvar $prompt "Do"
    end
    send "q"
    gosub :land
    if ($prompt = "Planet")
        settexttrigger 1 :jumpok "Landing sequence engaged..."
        settexttrigger 2 :jumpno "That planet is not in this sector."
        pause
        :jumpok
            halt
        :jumpno
            setvar $planet $var
            send "q*"
            gosub :land
            waitfor "Landing sequence engaged..."
            echo ansi_14 "** Quickdraw: " ansi_12 "Desired planet unavailable"
            halt
    end

# -Cluster scan----------------------------------------------------------------
elseif ($menu = "L")
    if ($prompt <> "<StarDock>") and ($prompt <> "Planet") and ($prompt <> "Do") and ($prompt <> "Which") and ($prompt <> "Command")
        echo ansi_14 "** Quickdraw: " ansi_12 "Cannot run a scan from here"
        halt
    end
    gosub :quickStats
    if ($prompt = "Planet")
        gosub :planetNumber
        gosub :planetCount
    end
    if ($prompt <> "Command")
        send "q"
    end
    if ($lrs = "Holo")
        send "s h*"
        waitfor "Command [TL="
    end
    setvar $surround_loop 1
    while ($surround_loop <= sector.warpcount[$sect])
        setVar $adjacent sector.warps[$sect][$surround_loop]
        getDistance $distance $adjacent $sect
        setVar $surround_loop ($surround_loop + 1)
        setvar $var SECTOR.FIGS.OWNER[$adjacent]
        setvar $var2 SECTOR.FIGS.QUANTITY[$adjacent]
        setvar $var3 SECTOR.FIGS.ANOMOLY[$adjacent]
        if ($adjacent <> stardock) and ($adjacent > 10) and ($distance = 1) and (($var = "belong to your Corp") or ($var = "yours") or ($var2 < 1))
             send "m" $adjacent "* "
             if ($lrs = "Holo")
                 send "s ds h"
             elseif ($lrs = "Density")
                 send "s"
             end
             send "< "
        end
    end
    if ($prompt <> "Command")
        gosub :land
    end

# -Mow to another sector-------------------------------------------------------
elseif ($menu = "M")
    if ($prompt <> "<StarDock>") and ($prompt <> "Planet") and ($prompt <> "Do") and ($prompt <> "Which") and ($prompt <> "Command")
        echo ansi_14 "** Quickdraw: " ansi_12 "Cannot mow from here"
        halt
    end
    gosub :quickStats
    echo ansi_14 "** What sector would you like to mow to? "
    getconsoleinput $var
    :getMow
        getcourse $var2 $sect $var
        if ($var2 = "-1")
            send "^f" $sect "*" $var "*q"
            waitfor ": ENDINTERROG"
            goto :getMow
        end
    add $var2 2
    setvar $i 2
    if ($prompt <> "Command")
        send "q"
    end
    while ($i <> $var2)
        setvar $var3 $var2[$i]
        send "m" $var2[$i] "* "
        if ($var2[$i] > 10) and ($var2[$i] <> STARDOCK)
            send "za 9999* * "
            if (SECTOR.FIGS.OWNER[$var3] <> "belong to your Corp") and (SECTOR.FIGS.OWNER[$var3] <> "yours") and ($i > 2)
                send "f 1* cd "
            end
        end
        add $i 1
    end
    send "^q"
    waitfor ": ENDINTERROG"
    gosub :quickStats
    if ($sect = 1)
        setvar $prompt "Do"
        gosub :land
    elseif ($sect = STARDOCK)
        setvar $prompt "<StarDock>"
        gosub :land
    end

# -----Surround current sector-------------------------------------------------
elseif ($menu = "R")
    if ($prompt <> "Planet") and ($prompt <> "Command") and ($prompt <> "Which") and ($prompt <> "<StarDock>")
        echo ansi_14 "** Quickdraw: " ansi_12 "You can not run this from here"
        halt
    end
    echo ansi_14 "** How many fighters per sector? "
    getconsoleinput $figsLay
    gosub :quickstats
    if ($figsLay = "")
        setvar $figsLay 1
    end
    isnumber $var $figslay
    if ($var = 0)
        echo ansi_14 "** Quickdraw: " ansi_12 "That is an invalid input"
        halt
    end
    if ($prompt = "Planet")
        gosub :planetCount
        gosub :planetNumber
    end
    if ($prompt = "Planet") or ($prompt = "Which") or ($prompt = "<StarDock>")
        send "q"
    end
    setvar $var ""
    setvar $surround_loop 1
    while ($surround_loop <= sector.warpcount[$sect])
        setVar $adjacent sector.warps[$sect][$surround_loop]
        getDistance $distance $adjacent $sect
        setVar $surround_loop ($surround_loop + 1)
        if ($adjacent <> stardock) and ($adjacent > 10) and ($distance = 1)
             send "m" $adjacent " * za 9999* * f " $figsLay "* cd < "
        else
            setvar $var $var & $adjacent & " "
        end
    end
    gosub :land
    if ($var <> "")
        if ($prompt = "Planet")
            waitfor "Landing sequence engaged..."
        elseif ($prompt = "Which")
            waitfor "<Port>"
        elseif ($prompt = "<StarDock>")
            waitfor "Landing on Federation StarDock."
        end
        echo ansi_14 "** Quickdraw: " ansi_6 "Sectors not figged - " ansi_14 $var
    end

# -Burst commands--------------------------------------------------------------
elseif ($menu = "U")
    echo ansi_14 "** Enter commands"
    getconsoleinput $var
    replacetext $var #42 "*"
    send $var

# -Transport to another ship---------------------------------------------------
elseif ($menu = "X")
    if ($prompt <> "Planet") and ($prompt <> "Command") and ($prompt <> "Which") and ($prompt <> "<StarDock>") and ($prompt <> "Do")
        echo ansi_14 "** Quickdraw: " ansi_12 "You can not run this from here"
        halt
    end
    setvar $pass ""
    if ($prompt = "Planet")
        gosub :planetNumber
    end
    gosub :quickStats
    if ($prompt = "Planet")
        gosub :planetCount
    end
    :getShip
        echo ansi_14 "** Enter ship number or ? to see ships "
        getconsoleinput $ship
        uppercase $ship
        if ($ship = "?")
            send "q x"
            if ($sect < 11) or ($sect = STARDOCK)
                send "*"
            end
            send "q"
            gosub :land
            goto :getShip
        else
            isnumber $var $ship
            if ($var = 0)
                echo ansi_14 "** Quickdraw: " ansi_12 "Ivalid input"
                halt
            end
            echo ansi_14 "** Enter ships password (Enter for none) "
            getconsoleinput $pass
        end
    setvar $sectlast $sect
    send "q x"
    if ($sect < 11) or ($sect = STARDOCK)
        send "*"
    end
    send $ship "*"
    if ($pass <> "")
        send $pass "*"
    else
        send " "
    end
    send "q"
    gosub :quickStats
    if ($sect = $sectlast)
        gosub :land
    elseif ($sect = STARDOCK)
        setvar $prompt "<StarDock>"
        gosub :land
    elseif ($sect = 1) or ($sect = $rylos) or ($sect = $alpha)
        setvar $prompt "Which"
        gosub :land
    end

# -Set NavPoints---------------------------------------------------------------
elseif ($menu = "Y")
    echo ansi_14 "** Which NavPoint would you like to set? (1-4, V=View NavPoints) "
    getconsoleinput $menu SINGLEKEY
    uppercase $menu
    if ($menu = "V")
        if ($prompt <> "Command")
            send "q"
        end
        send "yq"
        if ($prompt <> "Command")
            gosub :land
        end
    elseif ($menu = 1) or ($menu = 2) or ($menu = 3) or ($menu = 4)
        echo ansi_14 "** What sector would you like to set it to? "
        getconsoleinput $var
        if ($prompt <> "Command")
            send "q"
        end
        send "y " $menu $var
        if ($var < 10000)
            send "*"
        end
        send "q"
        if ($prompt <> "Command")
            gosub :land
        end
    end
end
halt

# -Landing sequence------------------------------------------------------------
:land
    if ($prompt = "Which")
        send "p t "
        :porting
            settexttrigger 1 :port
            pause
            :port
                setvar $line CURRENTLINE
                if ($line = "") or ($line = "<Port>")
                    goto :porting
                elseif ($line = "Docking...")
                    send "n"
                    if ($sect = 1)
                        setvar $errorPort 1
                        goto :landTerra
                    else
                        echo ansi_14 "** Quickdraw: " ansi_12 "The class 0 port has been destroyed"
                    end
                end
    elseif ($prompt = "<StarDock>")
        send "p s "
    elseif ($prompt = "Do")
        :landTerra
            send "l "
            if ($plscn = "Yes")
                send "1* "
            end
            if ($prompt = "Which")
                echo ansi_14 "** Quickdraw: " ansi_12 "The class 0 port has been destroyed"
            end
    elseif ($prompt = "Planet") or ($prompt = "Citadel")
        send "l "
        if ($planetCount > 1) or ($plscn = "Yes") or ($menu = "J")
            send $planet "* "
            waitfor "Landing sequence engaged..."
        else
            waitfor "<Preparing ship to land on planet surface>"
        end
        if ($prompt = "Citadel")
            send "c"
        end
    end
return

# -Planet count in sector------------------------------------------------------
:planetCount
    setvar $planetcount SECTOR.PLANETCOUNT[$sect]
return

# -Planet number---------------------------------------------------------------
:planetNumber
  send "*"
  waitfor " in sector "
  getword CURRENTLINE $planet 2
  striptext $planet "#"
return

# -Get Quick Stats-------------------------------------------------------------
:quickStats
setvar $line ""
setvar $var 0
send "/^q"
:info
  killalltriggers
  settextlinetrigger 1 :line #179
  settextlinetrigger 2 :done ": ENDINTERROG"
  pause
    :line
      killtrigger 2
      setvar $line $line & CURRENTLINE
      goto :info
    :done
      killtrigger 1
      replacetext $line #179 " "
      striptext $line ","
      while ($var < 10)
          replacetext $line "  " " "
          add $var 1
        end
      getword $line $sect 2
      getword $line $turns 4
      getword $line $creds 6
      getword $line $figs 8
      getword $line $shlds 10
      getword $line $hlds 12
      getword $line $ore 14
      getword $line $org 16
      getword $line $equ 18
      getword $line $col 20
      getword $line $phot 21
      if ($phot = "Phot")
          getword $line $phot 22
        else
          setvar $phot ""
        end
      gettext $line $armd "Armd " " Lmpt"
      gettext $line $lmpt "Lmpt " " GTorp"
      gettext $line $gtorp "GTorp " " TWarp"
      gettext $line $twarp "TWarp " " Clks"
      gettext $line $clks "Clks " " Beacns"
      gettext $line $beacns "Beacns " " AtmDt"
      gettext $line $atmdt "AtmDt " " Crbo"
      gettext $line $crbo "Crbo " " EPrb"
      gettext $line $eprb "EPrb " " MDis"
      gettext $line $mdis "MDis " " PsPrb"
      gettext $line $psprb "PsPrb " " PlScn"
      gettext $line $plscn "PlScn " " LRS"
      gettext $line $lrs "LRS " " Aln"
      gettext $line $aln "Aln " " Exp"
      gettext $line $exp "Exp " " Corp"
      if ($exp = "")
          gettext $line $exp "Exp " " Ship"
          setvar $corp 0
        else
          gettext $line $corp "Corp " " Ship"
        end
return

# -----Check Alpha Centauri and Rylos Sectors----------------------------------
:class0
  setvar $alpha ""
  setvar $rylos ""
  setvar $file GAMENAME & "_class0.txt"
  fileexists $var $file
  if ($var)
      read $file $alpha 1
      read $file $rylos 2
  end
return

