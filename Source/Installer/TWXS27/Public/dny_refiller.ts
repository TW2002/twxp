# -------------------------------------------------------------------
# === Dnyarri's corpie refiller ===
# Lifts from a planet and refills a corpie's ship.
# Designed to be called from a bot.
#
# 4 vars:
# $target_corpie  - The refill target. Not case sensitive.
# $refil_amt      - The amount to refill with.
# $refil_limit    - The number of times to refill.
# $refil_timing   - The lift timing
#    Blitz   - 10ms to 250ms.
#    Quarter - 250ms to 500ms.
#    Half    - 500ms to 1 second.
#    Full    - 1 second to 2 seconds.
#    Double  - 2 second to 5 seconds.
#    Quad    - 5 seconds to 10 seconds.
#    Max     - 10 seconds to 30 seconds.
#
# -------------------------------------------------------------------

:start
    reqRecording

    send " * "
    waitFor "(?="    
    setVar $line CURRENTLINE
    getWord $line $prompt 1

    if ($prompt <> "Citadel") AND ($prompt <> "Planet")
           send "'[Dny Refiller]: Must start at the citadel or planet prompt.*"
           halt
    end

    if ($prompt = "Planet")
           send "c"
           settextlinetrigger no_cit :no_cit "Do you wish to construct one?"
           settextlinetrigger no_cit_yet :no_cit_yet "Be patient, your Citadel is not yet finished."
           waitFor "Citadel command (?=help)"
    end

    loadVar $target_corpie
    loadVar $refil_timing
    loadVar $refil_limit
    loadVar $refil_amt
    lowerCase $refil_timing
    lowerCase $refil_limit
    lowerCase $refil_amt
    lowerCase $target_corpie

    if ($target_corpie = "")
           send "'[Dny Refiller]: Choose a corpie first!*"
           halt
    end

    isNumber $result $refil_limit
    if ($result < 1)
          setVar $refil_limit 0
    end

    isNumber $result $refil_amt
    if ($result < 1)
          setVar $refil_amt 9999999
    end

    if ($refil_timing = "double")
          setVar $max_timing 5000
          setVar $min_timing 2000
    elseif ($refil_timing = "quad")
          setVar $max_timing 10000
          setVar $min_timing 5000
    elseif ($refil_timing = "max")
          setVar $max_timing 30000
          setVar $min_timing 10000
    elseif ($refil_timing = "half")
          setVar $max_timing 1000
          setVar $min_timing 500
    elseif ($refil_timing = "quarter")
          setVar $max_timing 500
          setVar $min_timing 250
    elseif ($refil_timing = "blitz")
          setVar $max_timing 250
          setVar $min_timing 10
    else
          setVar $max_timing 2000
          setVar $min_timing 1000
    end

    send " c ;"
    waitFor "Max Fighters:"
    setVar $line CURRENTLINE
    stripText $line "Main Drive Cost:"
    stripText $line "Max Fighters:"
    stripText $line "Offensive Odds:"
    stripText $line ","
    getWord $line $max_ship_figs 2
    waitFor "Computer command [TL="
    if ($refil_amt > $max_ship_figs)
          setVar $refil_amt $max_ship_figs
    end
    send "q"
    waitFor "<Computer deactivated>"

    # Check for corp num...
    send "/"
    waitFor "Ship"
    setVar $line CURRENTLINE
    replacetext $line #179 " "
    striptext $line ","

    getWordPos $line $pos "Corp"
    if ($pos > 0)
           # They're on a corp
           setVar $corp_pos ($pos + 5)
           getWordPos $line $end_pos "Ship"
           setVar $end_pos ($end_pos - 1)
           cutText $line $corp_num $corp_pos ($end_pos - $corp_pos)
           striptext $corp_num " "
    else
           send "'[Dny Refiller]: You must be on a corp to use this!*"
           halt
    end
    setVar $refil_count 0

:loop_start
    killalltriggers

    # In the citadel.
    send " q d"
    waitFor "Planet #"
    setVar $line CURRENTLINE

    getWord $line $this_planet_number 2
    stripText $this_planet_number "#"
    getWord $line $this_sector_number 5
    stripText $this_sector_number ":"
   
    waitFor "Planet command (?=help)"
    send " m n t * c s* "
    waitFor "Warps to Sector(s) :"
    getSector $this_sector_number $sec

    # Info gathered and fighters loaded!
    setVar $max_traders $sec.TRADERS
    setVar $idx 1
    setVar $corpie_count 0
    setVar $trader_here 0
    while ($idx <= $max_traders)
          setVar $trader $sec.TRADER[$idx].NAME 
          lowerCase $trader
          getText $trader $ck "[" "]"
          if ($ck = $corp_num)
              getWordPos $trader $pos $target_corpie
              if ($pos > 0)
                    setVar $trader_here 1
                    goto :trader_check
              else
                    add $corpie_count 1
              end
          end
          add $idx 1
    end

    :trader_check
    if ($trader_here <> 1)
          # The trader isn't here. Wait a loop.
          goto :start_waiting
    end

    setVar $no_string ""
    setVar $key_idx 0
    while ($key_idx < $corpie_count)
          setvar $no_string $no_string & " n"
          add $key_idx 1
    end

    # Trader is in sector. Now we lift and fill.
    send " q q q z n t f " & $no_string & " y t " & $refil_amt & " * q q z n "
    add $refil_count 1

:land_to_cit
    send " l " & $this_planet_number & " * m n t * c s* "

:start_waiting
    killalltriggers
    setTextLineTrigger avoid_torp :no_torp "launched a P-Missile in sector"

    getRnd $wait_timing $min_timing $max_timing

    # echo "*Wait timing: " $wait_timing "*"

    # No limit?
    if ($refil_limit = 0)
         setDelayTrigger timing_delay :loop_start $wait_timing
         pause
    end

    # More refills to go?
    if ($refil_count < $refil_limit)
         setDelayTrigger timing_delay :loop_start $wait_timing
         pause
    end

:prog_end
    send "'[Dny Refiller]: Refiller has finished.*"
halt

:no_torp
    killalltriggers
    setDelayTrigger sudden_change :start_waiting 15000
    waitFor "Photon Wave Duration has ended in sector"
goto :start_waiting

:no_cit
    send "n"
    send "'[Dny Refiller]: This planet does not have a citadel!*"
halt

:no_cit_yet
    send "'[Dny Refiller]: This planet does not have a citadel yet!*"
halt
