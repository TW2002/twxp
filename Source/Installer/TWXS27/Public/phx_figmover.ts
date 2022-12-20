# Author:    p][x
# Script:    Fighter Mover 1.0

getword currentline $prompt 1
if ($prompt = "Citadel")
    send "q"
elseif ($prompt = "Command")
    echo ansi_14 "** Do you want to empty all planet fighters into the sector? "
    getconsoleinput $menu SINGLEKEY
    uppercase $menu
    if ($menu <> "Y")
        echo ansi_12 "** Then you must start this script from a planet."
        halt
    end
    setvar $planetNumbers ""
    gosub :planetNumbers
elseif ($prompt <> "Planet")
    echo ansi_12 "** This script must be started on a planet."
    halt
end

# -Quickstats------------------------------------------------------------------
setvar $line ""
setvar $var 0
send "/"
:qsTrig
  killalltriggers
  settextlinetrigger 1 :qsLine #179
  pause
    :qsLine
      setvar $line CURRENTLINE
      replacetext $line #179 " "
      getword $line $figsship 8
      striptext $figsship ","
      setvar $line ""

# -Get planet number, fighter amount, and max fighter capacity-----------------
:planetData
    if ($prompt = "Planet")  or ($prompt = "Citadel") or ($planetNumbers <> 0)
        send "*"
        settextlinetrigger 1 :planetNumber "Planet #"
        settextlinetrigger 2 :planetFigs "Fighters    "
        pause
        :planetNumber
            gettext currentline $planetnumber "et #" " in"
            pause
        :planetFigs
            getword currentline $figsplanet 5
            getword currentline $planetmax 7
            striptext $figsplanet ","
            striptext $planetmax ","
            setvar $figsroom ($planetmax - $figsplanet)
    end

# -Get sector figs and max figs on ship----------------------------------------
    if ($figssector = 0) or ($figsmax = 0)
        send "q *c ;q "
        if ($figssector = 0)
            settextlinetrigger 1 :sectorFigs "Fighters: "
        end
        if ($figsmax = 0)
            settextlinetrigger 2 :shipMax "Max Fighters:"
        end
        pause
        :sectorFigs
            getword currentline $figssector 2
            striptext $figssector ","
            pause
        :shipMax
            gettext currentline $figsmax "Fighters:" "  Offensive"
            striptext $figsmax ","
            send "l " $planetnumber "* "
            waitfor "Planet command (?=help) [D]"
    end

if ($menu = "P")
    goto :start
end

# -Move fighters which way?----------------------------------------------------
echo ansi_14 "** Move fighters from " ansi_12 "P" ansi_14 "lanet to sector or " ansi_12 "S" ansi_14 "ector to planet? "
getconsoleinput $menu SINGLEKEY
uppercase $menu

# -Start moving----------------------------------------------------------------
:start
# -Move fighters from planet to sector-----------------------------------------
if ($menu = "P")
    :getPlanetMove
        if ($planetNumbers <> 0)
            setvar $move $figsplanet
            goto :moveUp
        end
        echo ansi_14 "** How many of this planets fighters do you want to move? " ansi_12 "[" ansi_14 $figsplanet ansi_12 "] "
        getconsoleinput $move
        if ($move = "")
            setvar $move $figsplanet
            goto :moveUp
        end
        isnumber $var $move
        if ($move > $figsplanet) or ($var = 0)
            echo ansi_12 "** You don't have that many fighters"
            goto :getPlanetMove
        end
    :moveUp
        while ($move > $figsmax)
            add $figssector $figsmax
            send "m n t *q f " $figssector "* cd l " $planetnumber "* "
            subtract $move $figsmax
        end
        if ($move > 0)
            add $figssector $move
            send "m n t " $move "*q f " $figssector "* cd l " $planetnumber "* m n t * "
            subtract $move $move
        end
        if ($planetNumbers <> 0)
            goto :nextPlanet
        end
# -Move fighters from sector to planet-----------------------------------------
elseif ($menu = "S")
    if ($figsroom > $figssector)
        setvar $move $figssector
    elseif ($figsroom < $figssector)
        setvar $move $figsroom
    end
    echo ansi_14 "** How many sector fighters do you want to move? " ansi_12 "[" ansi_14 $move ansi_12 "] "
    getconsoleinput $var
    if ($var <> "")
        setvar $move $var
    end
    subtract $move 500
    subtract $move $figsship
    send "m n l * "
    while ($move > $figsmax)
        subtract $figssector $figsmax
        send "q f " $figssector "* cd l " $planetnumber "* m n l * "
        subtract $move $figsmax
    end
    subtract $figssector $move
    send "q f " $figssector "* cd l " $planetnumber "* m n l * "
    subtract $figssector $figsship
    send "q f " $figssector "* cd l " $planetnumber "* "
end

if ($prompt = "Citadel")
    send "c "
end

halt

:nextPlanet
    if ($planetNumbers <> 0)
        getword $planetNumbers $planetNumber $i
        if ($planetNumber <> "") and ($planetNumber <> 0)
            add $i 1
            send "q l " $planetNumber "* "
            goto :planetData
        end
    end
send "q "
halt

# -Get all planet numbers for emtpying all planets figs------------------------
:planetNumbers
    send "lq* "
    :planetsList
        gosub :killem
        settextlinetrigger 1 :planet "Planet #"
        settextlinetrigger 2 :planets "   <"
        settextlinetrigger 3 :planetsEnd "Land on which planet <"
        pause
    :planets
        gosub :killem
        gettext currentline $var "<" ">"
        setvar $planetNumbers $planetNumbers & "  " & $var
        goto :planetsList
    :planetsEnd
        gosub :killem
        setvar $planetNumbers $planetNumbers & " "
        getword $planetNumbers $planetNumber 1
        send "l " $planetNumber "* "
        setvar $i 2
        setvar $menu "P"
        return
    :planet
        setvar $prompt "Planet"
        return

# -Kill all triggers-----------------------------------------------------------
:killem
    killtrigger 1
    killtrigger 2
    killtrigger 3
return


        
        
        

        

        
        
        
        
        
        
        
        
        

