   gosub :BOT~loadVars

    setVar $BOT~help[1]  $BOT~tab&"unlock - unlock ship in citadel to it can be traded"
    gosub :bot~helpfile

# ============================== START UNLOCK (unlock) Sub ==============================
:unlock
    setVar $unlock_attempt 0
    gosub  :player~currentPrompt
    setVar $bot~validPrompts "Citadel"
    gosub :bot~checkstartingprompt
    setvar $switchboard~message "Unlock ship initiated*"
    gosub :switchboard~switchboard
    send "ryy"
    setTextlineTrigger unlock_menu :unlock_menu "Game Server"
    setTextLineTrigger enter_game :enter_game "==-- Trade Wars 2002 --=="
:unlock_tryagain
    setDelayTrigger unlock_ansiMenu :unlock_ansiMenu 2000
    pause
:unlock_ansiMenu
    if ($unlock_attempt < 10)
        add $unlock_attempt 1
        send "#"
        goto :unlock_tryagain
    end
    DISCONNECT
    halt
:unlock_menu
    killalltriggers
    send $letter & "*"
    waitOn "module now loading."
    send "**"
    waitOn "Enter your choice:"
:enter_game   
    killalltriggers
    send "t***"
    waitOn "Password?"
    send $BOT~password & "* * * c"
    waitOn "Citadel command (?=help)"
    setvar $switchboard~message "Ship has been unlocked!*"
    gosub :switchboard~switchboard
halt
# ============================== END UNLOCK (UNLOCK) Sub ==============================








# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\module_includes\bot\checkstartingprompt\bot"
