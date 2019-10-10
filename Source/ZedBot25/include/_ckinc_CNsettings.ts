goto :CNsettingsEOF

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

#        waitfor "Settings command (?=Help)"
        gosub :sendCNstring
#        send "?"
#        waitfor "Settings command (?=Help)"
        send "QQ"
        SetTextTrigger subStartCNcontinue1 :subStartCNcontinue "Command [TL="
        SetTextTrigger subStartCNcontinue2 :subStartCNcontinue "Citadel command (?=help)"
        pause
        :subStartCNcontinue
        killalltriggers
        return



# ----- SUB: end CN settings -----
:endCNsettings
    send "CN"
    waitfor "Settings command (?=Help)"
    gosub :sendCNstring
    send "?"
    waitfor "Settings command (?=Help)"
    send "QQ"
    SetTextTrigger subEndCNcontinue1 :subEndCNcontinue "Command [TL="
    SetTextTrigger subEndCNcontinue2 :subEndCNcontinue "Citadel command (?=help)"
    pause
    :subEndCNcontinue
    killalltriggers
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

:CNsettingsEOF
