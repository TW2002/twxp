# AFK 1.2

setvar $msg "`*                    ---*                   !   !*                   !   !*                   !   !*                   !   !*               ----!   !----*          ----!    !   !    !*         !    !    !   !    !    --*         !    !    !   !    !   /  !*          !                 !  /   !*          !                  !/   /*           !                     /*           !                    /*            !                 /*             !              /**"
setvar $seconds 225
echo ANSI_14 "**        .\\            //."
echo ANSI_14 "*      . \ \          / /."
echo ANSI_14 "*      .\  ,\    /|_ /,.-"
echo ANSI_14 "*       -.   \  <^//  ."
echo ANSI_14 "*       ` -   `-'  \  -"
echo ANSI_14 "*         '.       /.\`"
echo ANSI_14 "*            -    .-"
echo ANSI_14 "*            :`//.'"
echo ANSI_12 "*   /(        " ANSI_14 ".`.'"
echo ANSI_12 "*  (((       " ANSI_14 ".' " ANSI_12 " /   /"
echo ANSI_12 "* (()))    (    ((  ((    \"
echo ANSI_12 "* (((())   ))  (()) \ \   ))"
echo ANSI_12 "* (()) " ANSI_14 "p][x scripts" ANSI_12 " ))(( (("
:menu
  replacetext $msg "*" #42
  echo ANSI_14 "**     -= " ansi_12 "p][x AFK 1.2" ansi_14 " =-"
  echo ansi_14 "* C" ansi_12 "ommands/Message  " ansi_14 $msg
  echo ansi_14 "* T" ansi_12 "ime in seconds   " ansi_14 $seconds
  echo ansi_14 "* G" ansi_12 "o "
  getconsoleinput $menu SINGLEKEY
  uppercase $menu
  if ($menu = "G")
      goto :go
    elseif ($menu = "C")
      echo ansi_14 "*Enter your commands or message"
      echo ansi_14 "*Use ` for FedCom, ' for SubCom, " #42 " for ENTER*"
      getconsoleinput $msg
    elseif ($menu = "T")
      echo ansi_14 "*How many seconds "
      getconsoleinput $seconds
    end
  goto :menu
:go
  replacetext $msg #42 "*"
  setvar $time ($seconds * 1000)
:wait
  killalltriggers
  send $msg
  setDelayTrigger 1 :wait $time
  settexttrigger 2 :wait "INACTIVITY WARNING"
  pause
