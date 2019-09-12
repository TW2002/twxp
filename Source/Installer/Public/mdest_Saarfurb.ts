# ----- SCRIPT NAME AND VERSION -----
# ----- Adapted from Cherokees Furbing script, sits on dock -----
# ----- between runs and replenishs Shields and Figs on Furber -----
setVar $scriptname "Saarfurb"
setVar $version "1.3"
setvar $CD 0
# ----- INCLUDES -----
include "include\_ckinc_CNsettings.ts"

# CREDITS
# -------
# Written by Cherokee

# NOTES
# -----
# Sell or tow any existing furbs at stardock before running this script

# REVISIONS
# ---------
# 1.0.0 Working Version
# 1.0.1 Allows for buying 0 additional holds on furbs.
# 1.0.2 Fixed bug when ore was low.
# 1.1.0 Now furbs on FAKE busts too.
# 1.1.1 minor bug fix.
# 1.2.0 Variable wait time after furbing
# 2.0.0 auto-set CN settings, TWX 2.0 compliant
# 2.0.1 - 2.0.3 minor bug fixes
# SaarFurb version 1.3 -- now callable with Rinbot

loadVar $shipletter
loadVar $addholds
loadVar $fakeletter
loadVar $fakeholds
loadVar $depositSector
loadVar $depositPlanet

# getInput $tobuy      "How many furbs to buy ? " 0
setVar $tobuy 1
if ($shipletter = 0)
	getInput $shipletter "What ship letter are furbs (stock H) ? " "H"
end
# setVar $shipletter H
if ($addholds = 0)
	getInput $addholds   "How many holds to add (stock 33) ? " 33
end
#setVar $addholds 65
if ($fakeletter = 0)
	getInput $fakeletter "What ship letter for FAKES (stock O) ? " "O"
end
#setVar $fakeletter O
if ($fakeholds = 0)
	getInput $fakeholds  "How many holds for FAKES (stock 97) ? " 97
end
#setVar $fakeholds 90
# getInput $waitsecs   "How long to pause in the sector after delivering a furb?" 15
setVar $waitsecs 2
setVar $waitms $waitsecs
multiply $waitms 1000
if ($depositSector = 0)
	getInput $depositSector "What sector to deposit cash (-1 for none)? "
end
if ($depositPlanet = 0)
	getInput $depositPlanet "Which planet to deposit cash (-1 for none)? "
end

# If we are on a planet or in computer/corp menu and submenus, put us back to command prompt
send "QQQQ*"

# clear avoids
send "CV0*YYQ"

gosub :_ckinc_CNsettings~startCNsettings

send "' " & $scriptname & " v. " & $version & " - Buying " & $tobuy & " Furbs.*"

# Find out where Stardock Is
:get_dock
    setTextLineTrigger dock :dock "(S) Sector  :"
    setTextLineTrigger dock2 :dock2 "(T) Sector  :"
    send "NQ* "
    pause

    :dock2
        killalltriggers
        setTextLineTrigger dock3 :dock ") Sector  :"
        pause

:dock
    killalltriggers
    getWord CURRENTLINE $stardock 4
    setTextLineTrigger current :current "Command [TL="
    pause

:current
    getWord CURRENTLINE $current_sector 2
    cutText $current_sector $current_sector 16 6
    stripText $current_sector "]"
    if ($current_sector <> $stardock)
        send "'I'm not at the Stardock, halting script!*"
        halt
    end

:getThisShip
    setVar $shipindicator $stardock & "+"
    send "CZQ"
    setTextLineTrigger getcurrentship :getcurrentship $shipindicator
    pause

    :getcurrentship
        getWord CURRENTLINE $towship 1


:buyfurbs
    setVar $i 0
    if ($tobuy > 0)
        send "PSS"
    end
    :buyonefurb
        if ($tobuy > $i)
            add $i 1
            send "BNY" & $shipletter & "YP" & "SAARFURB " & $i & "***"
            goto :buyonefurb
        end
# Refurb Furber
    gosub :Furbfurber


:listfurbs
    send "S"
    setVar $i 0
    waitfor "<Sell an old Ship>"
    :eachfurb
    setTextLineTrigger notefurb :notefurb "SAARFURB"
    setTextTrigger listend :listend "Choose which ship to sell"
    pause

    :notefurb
        killalltriggers
        getWord CURRENTLINE $isdock 2
        if ($isdock = $stardock)
            add $i 1
            getWord CURRENTLINE $furb[$i] 1
        end
        goto :eachfurb

    :listend
        killAllTriggers
        send "QQQ"
        setVar $i 0
        if ($addholds > 0)
            goto :loadholds
        else
            goto :furbresponder
        end

        :loadholds
            if ($tobuy > $i)
                add $i 1
                send "x  " & $furb[$i] & "* QPSSPA" & $addholds & "*YQQQ"
                goto :loadholds
            end
            send "X  " & $towship & "* q"


:furbresponder
        setVar $i 0

    :furbrequest
        if ($i = $tobuy)
            setVar $tobuy 1
            goto :buyfurbs
        end
        send "PS"
# Dump cash in cit Format credits
        If ($Credits > 110000000) AND ($depositSector <> "-1")
          add $CD 1
          send "QM" & $depositSector & "* YY L" & $depositPlanet & "* TNT1*C TT100000000*QQ" & $stardock & "* YY PS"" 
          subtract $Credits 100000000
          send "'100M Credits safely deposited to citadel*" 
        end
        send "' " & $scriptname & " v. " & $version & " - With " & $Credits & "(" & $CD & ")" &   " credits, Ready to bring a furb.*"
        setTextLineTrigger furbrequested :furbrequested "Busted in ship"
        setTextLineTrigger fakefurbrequested :fakefurbrequested "FAKE Busted in Ship"
        pause

    :furbrequested
        send "Q"
        killAllTriggers
        setVar $furbtype "furb"
        cutText CURRENTLINE $bustship 25 4
        stripText $bustship "."
        goto :getshiploc

    :fakefurbrequested
        send "Q"     
        killalltriggers
        setVar $furbtype "fake"
        # R Cherok FAKE Busted in Ship 49, need a super furb
        cutText CURRENTLINE $bustship 30 4
        stripText $bustship "."
        goto :getshiploc


        :getshiploc
            striptext $bustship ","
            striptext $bustship " "
            striptext $bustship "F"
            striptext $bustship "n"
            send "CZQ"
            waitfor "<Active Ship Scan>"
            :eachshiploc
            setTextLineTrigger shiploc :shiploc $bustship
            setTextLineTrigger nofind :nofind "Computer command [TL="
            pause

            :nofind
                killalltriggers
                send "' " & $scriptname & " v. " & $version & " - Can't find ship " & $bustship & ", script resetting.*"
                goto :furbrequest

            :shiploc
                killalltriggers
                getWord CURRENTLINE $isbustship 1
                if ($isbustship = $bustship)
                    getWord CURRENTLINE $bustloc 2
                    send "' " & $scriptname & " v. " & $version & " - Ship " & $bustship & " found, bringing a furb.*"
                    if ($furbtype = "fake")
                        goto :buyfakefurb
                    else
                        goto :towfurb
                    end
                else
                    goto :eachshiploc
                end

            :buyfakefurb
                send "PSSBNY" & $fakeletter & "YP" & "CK FAKE FURB" & "***"
                send "S"
                waitfor "<Sell an old Ship>"
                :eachfake
                setTextLineTrigger notefake :notefake "CK FAKE FURB"
                pause

                :notefake
                    killalltriggers
                    getWord CURRENTLINE $isdock 2
                    if ($isdock = $stardock)
                        getWord CURRENTLINE $fake[1] 1
                        echo "***" & $fake[1] & "***"
                        send "QQQX  " & $fake[1] & "* QPSSPA" & $fakeholds & "*YQQQX  " & $towship & "* Q"
                        goto :towfurb
                    else
                        goto :eachfake
                    end

            :towfurb
                if ($furbtype = "furb")
                    add $i 1
                end
                SetTextTrigger noFig :noFig "blind?"
                SetTextLineTrigger lowShipOre :lowShipOre "You do not have enough Fuel Ore to make the jump."
                SetTextLineTrigger locked :locked "Locating beam pinpointed"
                SetTextTrigger adj :adj "NavPoint Settings"
                SetTextLineTrigger atdock :atdock "You are already in that sector!"
                if ($furbtype = "furb")
                    send "WN" & $furb[$i] & "*"
                elseif ($furbtype = "fake")
                    send "WN" & $fake[1] & "*"
                end
                send "M" & $bustloc & "*Y"
                pause

            :noFig
                killalltriggers
                send "NW"
                if ($furbtype = "furb")
                    subtract $i 1
                end
                send "'THERE IS NO FREAKING FIG THERE, ARE YOU TRYING TO GET ME KILLED?*"
                goto :furbrequest

            :adj
                killalltriggers
                send "*q*"
                send "'Why am I furbing adjacent to stardock?*"
                goto :locked

            :atdock
                killalltriggers
                send "*"
                if ($furbtype = "furb")
                    subtract $i 1
                end
                send "'That ship is at stardock, try again*"
                goto :furbrequest

            :lowShipOre
                killalltriggers
                send "W"
                if ($furbtype = "furb")
                    subtract $i 1
                end
                send "' " & $scriptname & " v. " & $version & " - "
                send "'I don't have enough ore, how did this happen?*"
                send "'You can try to make me furb a closer ship that has an ore selling port.*"
                send "'If that doesn't work, I just can't help you.*"
                goto :furbrequest

            :locked
                killalltriggers
                send "Y"
                waitFor "Command [TL="
                send "W"
                waitfor "You shut off your Tractor Beam."
                send "' " & $scriptname & " v. " & $version & " - Furb delivered*"
                if ($waitsecs > 0)
#                    send "TCYF998877665544332211^MQ"
#                    send "CYT500000^MQ"
                    send "' " & $scriptname & " v. " & $version & " - Pausing " & $waitsecs & " seconds for you to dump cash.*"
                    setDelayTrigger loadore :loadore $waitms
                    pause

                end

                :loadore

                    :checkPort
                        send "D"
                        waitfor "<Re-Display>"
                        setTextLineTrigger getPort :getPort "Ports   :"
                        setTextLineTrigger noport :noport "Command [TL="
                        pause
                        pause
                        :getPort
                            killalltriggers
                            getText CURRENTLINE $port[$current_ship] ", Class " " ("
                            if ($port[$current_ship] <> 3) and ($port[$current_ship] <> 4) and ($port[$current_ship] <> 5) and ($port[$current_ship] <> 7)
                                send "'This is not an ore selling port! I'll run of fuel if we're not careful!*"
                            else
                                send "P***"
                            end
                            SetTextTrigger noFig2 :noFig2 "blind?"
                            SetTextLineTrigger lowShipOre2 :lowShipOre2 "You do not have enough Fuel Ore to make the jump."
                            SetTextLineTrigger locked2 :locked2 "Locating beam pinpointed"
                            SetTextTrigger adj2 :adj2 "NavPoint Settings"
                            send "NSY"
                            pause

                            :noFig2
                                killalltriggers
                                send "N"
                                send "' " & $scriptname & " v. " & $version & " - "
                                send "'I SEEM TO HAVE LOST MY COMMISSION, SCRIPT HALTED*"
                                halt

                            :lowShipOre2
                                killalltriggers
                                send "' " & $scriptname & " v. " & $version & " - "
                                send "'I don't have enough ore, how did this happen?*"
                                send "'SCRIPT HALTED*"
                                halt

                            :locked2
                                killalltriggers
                                send "Y "
                                goto :furbrequest

                            :adj2
                                killalltriggers
                                send "* "
                                goto :furbrequest



                        :noport
                            killalltriggers
                            send "'There is no port, you can't SDT here!*"
                            halt







# ----- SUB: Start CN settings -----
:startCNsettings
    send "CN"

        SetTextLineTrigger ansi0 :ansi0 "(1) ANSI graphics            - Off"
        SetTextLineTrigger ansi1 :ansi1 "(1) ANSI graphics            - On"
        pause

        :ansi0
            killalltriggers
            setVar $cn1 0
            goto :cn1done
        :ansi1
            killalltriggers
            setVar $cn1 1
        :cn1done

        SetTextLineTrigger anim0 :anim0 "(2) Animation display        - Off"
        SetTextLineTrigger anim1 :anim1 "(2) Animation display        - On"
        pause

        :anim0
            killalltriggers
            setVar $cn2 0
            goto :cn2done
        :anim1
            killalltriggers
            setVar $cn2 1
        :cn2done

        SetTextLineTrigger page0 :page0 "(3) Page on messages         - Off"
        SetTextLineTrigger page1 :page1 "(3) Page on messages         - On"
        pause

        :page0
            killalltriggers
            setVar $cn3 0
            goto :cn3done
        :page1
            killalltriggers
            setVar $cn3 1
        :cn3done

        SetTextLineTrigger silence0 :silence0 "(7) Silence ALL messages     - No"
        SetTextLineTrigger silence1 :silence1 "(7) Silence ALL messages     - Yes"
        pause

        :silence0
            killalltriggers
            setVar $cn7 0
            goto :cn7done
        :silence1
            killalltriggers
            setVar $cn7 1
        :cn7done

        SetTextLineTrigger abortdisplay0 :abortdisplay0 "(9) Abort display on keys    - SPACE"
        SetTextLineTrigger abortdisplay1 :abortdisplay1 "(9) Abort display on keys    - ALL KEYS"
        pause

        :abortdisplay0
            killalltriggers
            setVar $cn9 0
            goto :cn9done
        :abortdisplay1
            killalltriggers
            setVar $cn9 1
        :cn9done

        SetTextLineTrigger messagedisplay0 :messagedisplay0 "(A) Message Display Mode     - Compact"
        SetTextLineTrigger messagedisplay1 :messagedisplay1 "(A) Message Display Mode     - Long"
        pause

        :messagedisplay0
            killalltriggers
            setVar $cna 0
            goto :cnadone
        :messagedisplay1
            killalltriggers
            setVar $cna 1
        :cnadone

        SetTextLineTrigger screenpauses0 :screenpauses0 "(B) Screen Pauses            - No"
        SetTextLineTrigger screenpauses1 :screenpauses1 "(B) Screen Pauses            - Yes"
        pause

        :screenpauses0
            killalltriggers
            setVar $cnb 0
            goto :cnbdone
        :screenpauses1
            killalltriggers
            setVar $cnb 1
        :cnbdone

        waitfor "Settings command (?=Help)"
        gosub :sendCNstring
        send "?"
        waitfor "Settings command (?=Help)"
        send "QQ"
        waitfor "Command [TL="
        return



# ----- SUB: end CN settings -----
:endCNsettings
    send "CN"
    waitfor "Settings command (?=Help)"
    gosub :sendCNstring
    send "?"
    waitfor "Settings command (?=Help)"
    send "QQ"
    waitfor "Command [TL="
    return


# ----- SUB: send CN string -----
:sendCNstring
    if ($cn1 = 0)
        send "1  "
    end
    if ($cn2 = 1)
        send "2  "
    end
    if ($cn3 = 1)
        send "3  "
    end
    if ($cn7 = 1)
        send "7  "
    end
    if ($cn9 = 1)
        send "9  "
    end
    if ($cna = 1)
        send "A  "
    end
    if ($cnb = 1)
        send "B  "
    end
    return

# ----- SUB: Furb the Furber -----
  :Furbfurber
  setVar $HoldsLost 0 
  setVar $CreditLimit 500000
  setVar $BuyFigs "1"
  setvar $BuyShield "1"
# get prices
  send p 
  waitOn "Commerce report for:"
  setTextLineTrigger Cargo :Cargo "A  Cargo holds  "
  setTextLineTrigger Fighters :Fighters "B  Fighters  "
  setTextLineTrigger Shield :Shield "C  Shield Points  "
  pause
  
  :Cargo
  getWord CURRENTLINE $CanBuyCargo 10
  pause
  
  :Fighters
  getWord CURRENTLINE $FigPrice 4
  getWord CURRENTLINE $CanBuyFigs 8
  pause
  
  :Shield
  getWord CURRENTLINE $ShieldPrice 5
  getWord CURRENTLINE $CanBuyShield 9
  
  if ($CanBuyCargo < $HoldsLost)
    setVar $Failed "1"
    goto :ExitPort
  end
  
  send "a" $CanBuyCargo "*y"  
  waitOn "Installing your next Cargo"
  setTextLineTrigger Credits :Credits "You have "
  pause
  
  :Credits
  getWord CURRENTLINE $Credits 3
  stripText $Credits ","

  if ($BuyFigs = "1")
    # calculate how many figs we should buy
    setVar $x ($Credits - $CreditLimit)
    
    if ($x > 0)
     if (($CanBuyFigs * $FigPrice) < $x)
      setvar $x $CanBuyFigs
      else
      divide $x $FigPrice
      subtract $x 1
     end
 
      if ($x > 0)
        send "b" $x "*"
        subtract $Credits ($x * $FigPrice)
      end
    end
  end

  if ($BuyShield = "1")
    # calculate how much shield we should buy
    setVar $x ($Credits - $CreditLimit)
    
    if ($x > 0)
     if (($CanBuyShield * $ShieldPrice) < $x)
      setvar $x $CanBuyShield
      else
      divide $x $ShieldPrice
      subtract $x 1
     end
    
      if ($x > 0)
        send "c" $x "*"
        subtract $Credits ($x * $ShieldPrice)
      end
    end
  end
 :ExitPort
  send q
  waitOn "Your option"
 # send "'I have " &  $Credits & " Credits remaining*"
  return
