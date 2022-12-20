#                                                                                          ¤
# AlphaNumericSymbolic (ANS) Corporate Code Generator v1.0 - ©                             ¤
# Copyright 2018 by: RexxCrow, founding member of The Affinity Group, An Alliance of Blue. ¤
#                                                                                          ¤
#                                                                                         ¤
#                             ¤                                                          ¤
#                          ¤     ¤                                                      ¤
#                       ¤           ¤                                                  ¤
#                    ¤  §cript§tinger Productions                                     ¤
#                 ¤  ¤  ¤  Creating Quality Scripts for a Quality Game                 ¤
#                          A Subsidiary of The Affinity Group                           ¤
#                                 An Alliance of Blue                                    ¤
#                                                                                         ¤
#                                                                                          ¤
# True build: 1.0.002-beta(WideRelease) Release Date: 10/22/2018                           ¤
# Designed for use with: TWX Proxy 2.04 through SWATH 1.8.3                                ¤
#                                                                                          ¤
#
#
# Purpose of Script:
#
# This is a CEO based script designed to assist in automating corporate creation and security
# related maintenance. During the use of this script if it detects that you are not yet on a
# corporation you will be prompted for your corporate name and it will be verified for use, 
# prior to continuing. the BOT CODE variable is saved and loaded under '$BOTCODE', this is only
# necessary to use if your BOT uses a similar method or if you adapt this to work with your BOT 
# or other corporate related script via trigger activation.
#
# Notable Features (v1.0):
# 1. Customizable Code Handler based on complete Alpha, Numeric, and Symbolic (ANS) characters.
# 2. Selectable automation for SubSpace Radio includes and corporate notifications via Corporate Memo's.
# 3. Folding SubSpace Radio Variance, (1-25000 double-sided.)
# 4. Updatable on the fly BOT Code, random 8-20 character selection with randomly self-created ANS.
# 5. Flying Corporate Memo Disbursement.
# 6. CEO pop-up review window.
# 7. Enhanced user displays with media events.
# 8. Built in error checking.
#
# Disclaimer and Guarantee:
#
# The author gives full permission to remove this entire above comment block '#' in "for personal use" copies
# only. Additionally, the author gives permission to modify, extract, compile, and/or alter the contents of this
# script within its entirety; so long as the modified or altered script should it be made or become publicly
# distributed is openly notated as being a modified or altered version of this original. This script has been
# thoroughly tested with the above met conditions set and altered, with no incurred problems having been
# experienced, it is believed by the author that all major bugs have been removed from this script and it is
# considered fully functional and fully operational while running within its intended specifications. However,
# the author makes not guarantees of compatibility and takes no responsibilities for any losses or damages to
# property, data, or other such claims being of monetary within nature or specification, or not, which may or
# may not have occurred prior to, during, or after the use of this script; hence this is a "use at your own risk"
# script. This script contains no known maliciously intent function, process, or routine.
#
# $Sounds - Should be changed to the correct directory storing all components as required, i.e. "C:\TWXProxy\Scripts\§cript§tinger\Sounds".
#
setVar $Sounds "C:\TWXProxy\Scripts\§cript§tinger\Sounds\"
loadVar $CGPC
loadVar $CGPL
loadVar $SSRC
loadVar $CGPCA
loadVar $CGPCH
loadVar $CGPSSR
loadVar $CGPSSRV
loadVar $CGPSSRVD
loadVar $BOTCODE
loadVar $BOTCODEC
IF $CGPCH=0
 setVar $CGPCH "AANNNSNA"
 saveVar $CGPCH
END
IF $CGPSSR=0
 setVar $CGPSSR 1
 saveVar $CGPSSR
END
IF $CGPSSRV=0
 setVar $CGPSSRV 1500
 saveVar $CGPSSRV
 setVar $CGPSSRVD ": " & ANSI_14 & "1" & "," & ANSI_14 & "500"
 saveVar $CGPSSRVD
END
IF $CGPCA=0
 setVar $CGPCA 1
 saveVar $CGPCA
END
send #27
echo "********************************"
echo ANSI_1 "              ÚÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_9 "Ä¿*"
echo ANSI_1 "              ³" ANSI_1 "Ú" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "¿*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m                                                  " #27 "[40m" ANSI_9 "³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m                                                  " #27 "[40m" "³" ANSI_1 "¿*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m" #27 "[1;33;44m          I" #27 "[0;33;44mnitiating " #27 "[1;33;44mY" #27 "[0;33;44mour " #27 "[0;33;44mT" #27 "[1;33;44mrade" #27 "[0;33;44mW" #27 "[1;33;44mars " #27 "[0;33;44m2" #27 "[1;33;44m00" #27 "[0;33;44m2          " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m" #27 "[1;33;44m       A" #27 "[0;33;44mlpha" #27 "[1;33;44mN" #27 "[0;33;44mumeric" #27 "[1;33;44mS" #27 "[0;33;44mymbolic " #27 "[1;33;44mC" #27 "[0;33;44mode " #27 "[1;33;44mG" #27 "[0;33;44menerator        " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m                                                  " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;34;44m                                                  " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;37;44m            õ" #27 "[1;30;44mcript" #27 "[1;37;44mõ" #27 "[1;30;44mtinger " #27 "[1;37;44mP" #27 "[1;30;44mroductions             " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "              ³" ANSI_9 "³" #27 "[1;37;44m                  C" #27 "[0;37;44mopy" #27 "[1;37;44mR" #27 "[0;37;44might " #27 "[1;37;44m2018                  " #27 "[40m" ANSI_9 "³³*"
echo ANSI_9 "              À³" #27 "[1;34;44m                                                  "  #27 "[40m" ANSI_9 "³³*"
echo ANSI_9 "               ³" #27 "[1;34;44m                                             " #27 "[0;32;44mv" #27 "[1;32;44m1" #27 "[0;32;44m." #27 "[1;32;44m0 " #27 "[40m" ANSI_9 "³³*"
echo ANSI_1 "               À" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ù" ANSI_9 "³*"
echo ANSI_9 "                   ÀÄ" ANSI_1 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÙ*"
echo "                                              " #27 "[1;37mP" #27 "[1;30mress " #27 "[1;37m'" #27 "[1;37m!" #27 "[1;37m' " #27 "[1;30mto " #27 "[1;37mT" #27 "[1;30merminate****************"
setDelayTrigger S1 :CGPCSC 3500
PAUSE
:CGPCSC
killTrigger S1
killTrigger EL1
killTrigger EL2
killTrigger EL3
killTrigger EL4
killTrigger EL5
killTrigger UGUI
IF $CGPSSR
 setVar $CGPSSRD  ANSI_10 & "Yes"
 IF $CGPSSRT=1
  setVar $CGPSSRV 1500
  saveVar $CGPSSRV
  setVar $CGPSSRVD ": " & ANSI_14 & "1" & "," & ANSI_14 & "500"
  saveVar $CGPSSRVD
  setVar $CGPSSRT 0
 END
ELSE
 setVar $CGPSSRD  ANSI_12 & "No"
 setVar $CGPSSRVD ANSI_12 & "N" & ANSI_4 & "/" & ANSI_12 & "A"
 setVar $CGPSSRT 1
END
IF $CGPCA
 setVar $CGPCAD  ANSI_10 & "Yes"
ELSE
 setVar $CGPCAD  ANSI_12 & "No"
END
IF $BOTCODE=0
 setVar $BOTCODED ANSI_4 & "NULL"
ELSE
 setVar $BOTCODED ANSI_6 & $BOTCODE
END
setVar $NCR 0
send #27
echo "********************************"
echo ANSI_1 "   ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "   ³  " #27 "[5;33m¯" ANSI_6 "                CGP C" ANSI_14 "orporate " ANSI_6 "S" ANSI_14 "ecurity " ANSI_6 "C" ANSI_14 "ontrol " ANSI_6 "C" ANSI_14 "onsole " ANSI_9 "               ³*"
echo ANSI_1 "   ÃÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä´**"
echo ANSI_11 "     1" ANSI_9 ")" ANSI_14 "  F" ANSI_6 "ormat " ANSI_14 "C" ANSI_6 "ode " ANSI_14 "H" ANSI_6 "andler" ANSI_14 ": " ANSI_15 $CGPCH "*"
echo ANSI_11 "     2" ANSI_9 ")" ANSI_14 "  S" ANSI_6 "ub" ANSI_14 "S" ANSI_6 "pace " ANSI_14 "R" ANSI_6 "adio " ANSI_14 "S" ANSI_6 "elect "  ANSI_14 "E" ANSI_6 "nabled" ANSI_14 ": " $CGPSSRD "*"
echo ANSI_11 "     3" ANSI_9 ")" ANSI_14 "  S" ANSI_6 "et " ANSI_14 "S" ANSI_6 "ub" ANSI_14 "S" ANSI_6 "pace " ANSI_14 "R" ANSI_6 "adio " ANSI_14 "V" ANSI_6 "ariance" ANSI_14 ": " ANSI_14 $CGPSSRVD "*"
echo ANSI_11 "     4" ANSI_9 ")" ANSI_14 "  C" ANSI_6 "orporate " ANSI_14 "A" ANSI_6 "utomation " ANSI_14 "E" ANSI_6 "nabled"  ANSI_14 ": " $CGPCAD "*"
echo ANSI_11 "     B" ANSI_9 ")" ANSI_14 "  G" ANSI_6 "enerated " ANSI_14 "C" ANSI_6 "orporate " ANSI_14 "BOT" ANSI_6 "CODE" ANSI_14 ": " $BOTCODED "*"
echo ANSI_11 "     D" ANSI_9 ")" ANSI_14 "  D" ANSI_6 "isburse " ANSI_14 "C" ANSI_6 "orporate " ANSI_14 "A" ANSI_6 "uthentication to " ANSI_14 "M" ANSI_6 "ember" ANSI_14 "'" ANSI_6 "s*"
echo ANSI_10 "     E" ANSI_9 ")" ANSI_14 "  E" ANSI_6 "nergize the " ANSI_14 "C" ANSI_6 "ode " ANSI_14 "G" ANSI_6 "eneration " ANSI_14 "P" ANSI_6 "re" ANSI_14 "P" ANSI_6 "rocessor*"
echo ANSI_11 "     V" ANSI_9 ")" ANSI_14 "  V" ANSI_6 "iew " ANSI_14 "M" ANSI_6 "y " "C" ANSI_6 "urrent " ANSI_14 "C" ANSI_6 "ode " ANSI_14 "V" ANSI_6 "erifications**"
echo ANSI_1 "   ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ*"
echo ANSI_7 "                                                        P" ANSI_8 "ress " ANSI_7 "'" ANSI_15 "!" ANSI_7 "' " ANSI_8 "to " ANSI_7 "T" ANSI_8 "erminate*****"
getConsoleInput $M1 SINGLEKEY
upperCase $M1
send #27
IF $M1=1
 goTo :FCGP
ELSEIF $M1=2
 goTo :SSR
ELSEIF $M1=3
 IF $CGPSSR
  goTo :SSRV
 END
 echo "************************************"
 echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
 echo ANSI_9 "      ³                                                            ³*"
 echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    S" ANSI_10 "orry" ANSI_2 ", S" ANSI_10 "ub" ANSI_2 "S" ANSI_10 "pace " ANSI_2 "R" ANSI_10 "adio " ANSI_2 "S" ANSI_10 "elect " ANSI_2 "E" ANSI_10 "nabled is " ANSI_2 "R" ANSI_10 "equired" ANSI_2 "." ANSI_9 "    ³*"
 echo ANSI_9 "      ³                                                            ³*"
 echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ"  ANSI_1  "ÄÙ****************"
 goSub :SF1
 setDelayTrigger UGUI :CGPCSC 1500
 PAUSE
ELSEIF $M1=4
 goTo :CA
ELSEIF $M1=B
 echo "*****" ANSI_2 "  G" ANSI_10 "enerate a " ANSI_2 "N" ANSI_10 "ew " ANSI_2 "BOTC" ANSI_10 "ode" ANSI_2 ", (" ANSI_10 "Y" ANSI_2 "es" ANSI_10 "/R" ANSI_2 "e" ANSI_10 "NULL" ANSI_10 "/A" ANSI_2 "bort" ANSI_2 ")" ANSI_10 ": "
 getConsoleInput $CBOTCR SINGLEKEY
 UPPERCASE $CBOTCR
 IF $CBOTCR=Y
  setVar $CBOT 1
  goTo :DTC
 ELSEIF $CBOTCR=R
  setVar $CBOT 0
  setVar $BOTCODE 0
  saveVar $BOTCODE
  setVar $BOTCODEC 0
  saveVar $BOTCODEC
  goTo :CGPCSC
 ELSEIF $CBOTCR=A
  goTo :CGPCSC
 ELSE
  echo "************************************"
  echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
  echo ANSI_9 "      ³                                                ³*"
  echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_10 "lease input a valid command" ANSI_2 ": " ANSI_2 "(" ANSI_6 "A" ANSI_2  "," ANSI_6 "R" ANSI_2 "," ANSI_6 "Y" ANSI_2 ")" ANSI_9 "    ³*"
  echo ANSI_9 "      ³                                                ³*"
  echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ"  ANSI_1  "ÄÙ****************"
  goSub :SF1
  setDelayTrigger UGUI :CGPCSC 1500
  PAUSE
 END
ELSEIF $M1=D
 setVar $DCA 1
 goTo :DTC
ELSEIF $M1=E
 goTo :ECGP
ELSEIF $M1=V
 goTo :DGUI
ELSEIF $M1=!
 goTo :HCGP
ELSEIF $M1=?
 goTo :CGPCSC
ELSE
 echo "************************************"
 echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
 echo ANSI_9 "      ³                                                          ³*"
 echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_10 "lease input a valid command" ANSI_2 ": " ANSI_2 "(" ANSI_6 "1" ANSI_2  "," ANSI_6 "2" ANSI_2 "," ANSI_6 "3" ANSI_2 "," ANSI_6 "4" ANSI_2 "," ANSI_6 "B" ANSI_2 "," ANSI_6 "D" ANSI_2 "," ANSI_6 "G" ANSI_2 "," ANSI_6 "!" ANSI_2 ")" ANSI_9 "    ³*"
 echo ANSI_9 "      ³                                                          ³*"
 echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ"  ANSI_1  "ÄÙ****************"
 goSub :SF1
 setDelayTrigger UGUI :CGPCSC 1500
 PAUSE
END
:SF1
fileExists $fc $Sounds & "03.WAV"
IF $fc
 Sound $Sounds & "03.WAV"
END
RETURN
:FCGP
# Code Handler function.
killTrigger UGUI
echo ANSI_2 "*****   (" ANSI_10 "NOTE " ANSI_2 "- " ANSI_10 "A" ANSI_2 "lpha" ANSI_10 ", N" ANSI_2 "umeric" ANSI_10 ", " ANSI_10 "S" ANSI_2 "ymbolic" ANSI_10 "; 8" ANSI_2 "-" ANSI_10 "C" ANSI_2 "haracter " ANSI_10 "L" ANSI_2 "imit" ANSI_2 ")*"
echo ANSI_10 "  P" ANSI_2 "lease enter your new " ANSI_10 "C" ANSI_2 "ode " ANSI_10 "H" ANSI_2 "andler" ANSI_10 ", " ANSI_2 "(" ANSI_10 "i" ANSI_2 "." ANSI_10 "e" ANSI_2 "., " ANSI_10 "'" ANSI_2 "AANNNSNA" ANSI_10 "'" ANSI_2 ")" ANSI_10 ": "
getConsoleInput $CGPCH
upperCase $CGPCH
stripText $CGPCH " "
getLength $CGPCH $CGPL
IF $CGPL=0
 setVar $CGPLT 1
ELSEIF $CGPL>8
 setVar $CGPLT 1
END
IF $CGPLT
 loadVar $CGPCH
 saveVar $CGPCH
 setVar $CGPLT 0
 send #27
 echo "************************************"
 echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
 echo ANSI_9 "      ³                                                                ³*"
 echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_10 "lease input a valid selection up to " ANSI_2 "E" ANSI_10 "ight " ANSI_2 "C" ANSI_10 "haracters" ANSI_9 "    ³*"
 echo ANSI_9 "      ³                   " ANSI_10 "in " ANSI_2 "L" ANSI_10 "ength" ANSI_2 ", (" ANSI_10 "i" ANSI_2 "." ANSI_10 "e" ANSI_2 ". " ANSI_10 "'" ANSI_2 "AANNNSNA" ANSI_10 "'" ANSI_2 ".)" ANSI_9 "                ³*"
 echo ANSI_9 "      ³                                                                ³*"
 echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
 goSub :SF1
 setDelayTrigger UGUI :FCGP 1500
 PAUSE
END
setVar $C 1
setVar $I 1
WHILE $C<=$CGPL
 cutText $CGPCH $CGP $C 1
 IF $CGP=A
  add $I 1
 ELSEIF $CGP=N
  add $I 1
 ELSEIF $CGP=S
  IF $I=1
  echo "************************************"
  echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
  echo ANSI_9 "      ³                                                                    ³*"
  echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    S" ANSI_10 "orry" ANSI_2 ", S" ANSI_10 "ymbols are not " ANSI_2 "P" ANSI_10 "ermitted for " ANSI_2 "F" ANSI_10 "irst " ANSI_2 "C" ANSI_10 "haracter use" ANSI_2 "." ANSI_9 "    ³*"
  echo ANSI_9 "      ³                                                                    ³*"
  echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ"  ANSI_1  "ÄÙ****************"
  goSub :SF1
  setDelayTrigger UGUI :FCGP 1500
  PAUSE
  END
  add $I 1
 ELSE
  setVar $C $CGPL+1
 END
add $C 1
END
IF $I=$C
 saveVar $CGPL
 saveVar $CGPCH
 goTo :CGPCSC
ELSE
 loadVar $CGPCH
 saveVar $CGPCH
 send #27
 echo "************************************"
 echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
 echo ANSI_9 "      ³                                                             ³*"
 echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_10 "lease input a valid selection" ANSI_2 ": (" ANSI_10 "i" ANSI_2 "." ANSI_10 "e" ANSI_2 ". " ANSI_10 "'" ANSI_2 "AANNNSNA" ANSI_10 "'" ANSI_2 ".)" ANSI_9 "    ³*"
 echo ANSI_9 "      ³                                                             ³*"
 echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
 goSub :SF1
 setDelayTrigger UGUI :FCGP 1500
 PAUSE
END
:SSR
# SubSpace Radio function.
IF $CGPSSR
 setVar $CGPSSR 2
 setVar $SSRD 0
 saveVar $SSRD
 setVar $SSRC 0
 saveVar $SSRC
ELSE
 setVar $CGPSSR 1
END
saveVar $CGPSSR
goTo :CGPCSC
:SSRV
# SubSpace Radio Variance.
killTrigger UGUI
echo ANSI_2 "*****    (" ANSI_10 "NOTE" ANSI_2 " - " ANSI_10 "A V" ANSI_2 "ariance of " ANSI_10 "'" ANSI_2 "1500" ANSI_10 "' " ANSI_2 "would only permit " ANSI_10 "C" ANSI_2 "hannel " ANSI_10 "B" ANSI_2 "ands " ANSI_10 "1501" ANSI_2 "-" ANSI_10 "58499" ANSI_2 ".)*"
echo ANSI_10 "  E" ANSI_2 "nter " ANSI_10 "Y" ANSI_2 "our desired " ANSI_10 "F" ANSI_2 "olding " ANSI_10 "V" ANSI_2 "ariance for " ANSI_10 "S" ANSI_2 "ub" ANSI_10 "S" ANSI_2 "pace " ANSI_10 "C" ANSI_2 "hannel " ANSI_10 "S" ANSI_2 "election" ANSI_10 ", " ANSI_2 "(" ANSI_10 "1" ANSI_2 "-" ANSI_10 "25000" ANSI_2 ")" ANSI_10 ": "
getConsoleInput $CGPSSRV
stripText $CGPSSRV " "
stripText $CGPSSRV ","
isNumber $Z $CGPSSRV
IF $Z
 IF $CGPSSRV>0
  IF $CGPSSRV<=25000
   setVar $setC $CGPSSRV
   goSub :CIP
   setVar $CGPSSRVD $setC
   saveVar $CGPSSRV
   saveVar $CGPSSRVD
   goTo :CGPCSC
  END
 END
END
send #27
echo "************************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "      ³                                                                     ³*"
echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_10 "lease input a valid " ANSI_2 "V" ANSI_10 "ariance selection" ANSI_2 ": (" ANSI_10 "i" ANSI_2 "." ANSI_10 "e" ANSI_2 ". " ANSI_10 "'" ANSI_2 "1" ANSI_10 "-" ANSI_2 "25000" ANSI_10 "'" ANSI_2 ".)" ANSI_9 "    ³*"
echo ANSI_9 "      ³                                                                     ³*"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
goSub :SF1
setDelayTrigger UGUI :SSRV 1500
PAUSE
:CA
# Corporate automation configuration.
IF $CGPCA
 setVar $CGPCA 2
ELSE
 setVar $CGPCA 1
END
saveVar $CGPCA
goTo :CGPCSC
:ECGP
# CGP - Code Creator function.
setVar $C 1
setVar $I 1
setVar $CGPC ""
WHILE $C<=$CGPL
 cutText $CGPCH $CGP $C 1
 IF $CGP="A"
  goSub :A
  add $I 1
 ELSEIF $CGP="N"
  goSub :N
  add $I 1
 ELSE
  goSub :S
  add $I 1
 END
add $C 1
END
IF $CGPSSR
 setVar $VL $CGPSSRV+1
 setVar $VH (60000-$CGPSSRV)-1
 getRND $SSRC $VL $VH
 setVar $setC $SSRC
 goSub :CIP
 setVar $SSRD $setC
 saveVar $SSRD
 saveVar $SSRC
END
saveVar $CGPC
IF $CGPCA
 goTo :DTC
END
goTo :DGUI
:A
getRND $A 1 26
IF $A=1
 setVar $A "A"
ELSEIF $A=2
 setVar $A "B"
ELSEIF $A=3
 setVar $A "C"
ELSEIF $A=4
 setVar $A "D"
ELSEIF $A=5
 setVar $A "E"
ELSEIF $A=6
 setVar $A "F"
ELSEIF $A=7
 setVar $A "G"
ELSEIF $A=8
 setVar $A "H"
ELSEIF $A=9
 setVar $A "I"
ELSEIF $A=10
 setVar $A "J"
ELSEIF $A=11
 setVar $A "K"
ELSEIF $A=12
 setVar $A "L"
ELSEIF $A=13
 setVar $A "M"
ELSEIF $A=14
 setVar $A "N"
ELSEIF $A=15
 setVar $A "O"
ELSEIF $A=16
 setVar $A "P"
ELSEIF $A=17
 setVar $A "Q"
ELSEIF $A=18
 setVar $A "R"
ELSEIF $A=19
 setVar $A "S"
ELSEIF $A=20
 setVar $A "T"
ELSEIF $A=21
 setVar $A "U"
ELSEIF $A=22
 setVar $A "V"
ELSEIF $A=23
 setVar $A "W"
ELSEIF $A=24
 setVar $A "X"
ELSEIF $A=25
 setVar $A "Y"
ELSE
 setVar $A "Z"
END
setVar $CGPC $CGPC & $A
RETURN
:N
getRND $N 1 10
IF $N=1
 setVar $N 1
ELSEIF $N=2
 setVar $N 2
ELSEIF $N=3
 setVar $N 3
ELSEIF $N=4
 setVar $N 4
ELSEIF $N=5
 setVar $N 5
ELSEIF $N=6
 setVar $N 6
ELSEIF $N=7
 setVar $N 7
ELSEIF $N=8
 setVar $N 8
ELSEIF $N=9
 setVar $N 9
ELSE
 setVar $N 0
END
setVar $CGPC $CGPC & $N
RETURN
:S
getRND $S 1 26
IF $S=1
 setVar $S "!"
ELSEIF $S=2
 setVar $S "@"
ELSEIF $S=3
 setVar $S "#"
ELSEIF $S=4
 setVar $S "^"
ELSEIF $S=5
 setVar $S #42
ELSEIF $S=6
 setVar $S "-"
ELSEIF $S=7
 setVar $S "+"
ELSEIF $S=8
 setVar $S "="
ELSEIF $S=9
 setVar $S "|"
ELSEIF $S=10
 setVar $S "\"
ELSEIF $S=11
 setVar $S "/"
ELSEIF $S=12
 setVar $S "?"
ELSEIF $S=13
 setVar $S ">"
ELSEIF $S=14
 setVar $S "<"
ELSEIF $S=15
 setVar $S ";"
ELSEIF $S=16
 setVar $S "."
ELSEIF $S=17
 setVar $S ":"
ELSEIF $S=18
 setVar $S "["
ELSEIF $S=19
 setVar $S "]"
ELSEIF $S=20
 setVar $S "{"
ELSEIF $S=21
 setVar $S "}"
ELSEIF $S=22
 setVar $S "("
ELSEIF $S=23
 setVar $S ")"
ELSEIF $S=24
 setVar $S ","
ELSEIF $S=25
 setVar $S "`"
ELSE
 setVar $S "'"
END
setVar $CGPC $CGPC & $S
RETURN
:DTC
# Corporate Automation function.
IF CONNECTED=0
 goTo :SCIR
END
cutText CURRENTLINE $CP 1 4
IF ($CP="Comm")
 send "T"
ELSEIF ($CP="Cita")
 send "X"
ELSEIF ($CP="Sett") OR ($CP="<Shi")
 send "QQT"
ELSEIF ($CP="Comp") OR ($CP="Plan") OR ($CP="<Sta")
 send "QT"
ELSEIF ($CP="Corp")
 send "?"
ELSE
 killAllTriggers
 send #27
 echo "************************************"
 echo ANSI_9 "         ÚÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¿*"
 echo ANSI_9 "         ³                                                                ³*"
 echo ANSI_9 "         ³  " #27 "[5;33m¯" ANSI_2 "    P" ANSI_2 "lease " ANSI_10 "M" ANSI_2 "ove to the " ANSI_10 "T" ANSI_2 "rade" ANSI_10 "W" ANSI_2 "ars " ANSI_10 "C" ANSI_2 "ommand " ANSI_10 "P" ANSI_2 "rompt" ANSI_10 ", " ANSI_2 "H" ANSI_10 "alting" ANSI_2 "!" ANSI_9 "    ³*"
 echo ANSI_9 "         ³                                                                ³*"
 echo ANSI_9 "         ÀÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÙ*********"
 goSub :SF1
 HALT
END
setTextTrigger EL1 :EL1 "Sorry, you're not on a Corp."
setTextTrigger EL2 :EL1 "Sorry, you're not in a Corporation."
waitFor "Corporate command [TL="
IF $CBOT
 goTo :GBC
END
IF $DCA
 send "T"
 waitFor "Type corporate message ["
 send "                      CLASSIFIED AND CONFIDENTIAL!*"
 send "               --==Disbursed Corporate Authentication==--*"
 send "   This Corporate Memoradum has been reissued to you from your CEO.*"
 send "    ------------------------------------------------------------*"
 IF $CGPSSR
  send "         Please Ensure your SubSpace Radio Channel to: " & $SSRC & "*"
 END
 send "                   Please note our Corporate Password: " & $CGPC & "*"
 IF $BOTCODEC
  send "     Active BOT Code: " & $BOTCODE & "*"
 END
 send "    ------------------------------------------------------------*"
 send "                      --==End of Transmission==--**Q"
 setVar $DCA 0
 waitFor "Command [TL="
 echo "********************************"
 echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
 echo ANSI_9 "      ³                                                                     ³*"
 echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    C" ANSI_10 "orporate " ANSI_2 "A" ANSI_10 "uthentication " ANSI_2 "R" ANSI_10 "eissued" ANSI_2 ", " ANSI_2 "D" ANSI_10 "isbursement " ANSI_2 "C" ANSI_10 "ompleted" ANSI_2 "." ANSI_9 "    ³*"
 echo ANSI_9 "      ³                                                                     ³*"
 echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
 setDelayTrigger UGUI :CGPCSC 3500
 PAUSE
END
IF $NCR=0
 setTextTrigger EL3 :EL2 "You're not the C.E.O.  of your Corp!"
 setTextTrigger EL4 :EL3 "The current password is"
 send "P"
 PAUSE
END
:EL3
IF $NCR=0
 send $CGPC & "*Y"
END
setTextTrigger EL5 :EL4 "Corporate command [TL="
PAUSE
:EL4
send "T"
waitFor "Type corporate message ["
send "                      CLASSIFIED AND CONFIDENTIAL!*"
send "                 --==New Corporate Authentication==--*"
send "  To insure our Corporation's Security is maintained, I have updated*"
send "       our codes. Included within are our new codes. Thank you.*"
send "      ----------------------------------------------------------*"
IF $CGPSSR
 send "        Please set your SubSpace Radio Channel to: " & $SSRC & "*"
END
send "           Please note our new Corporate Password: " & $CGPC & "*"
IF $BOTCODEC
 send "       Active BOT Code: " & $BOTCODE & "*"
END
send "      ----------------------------------------------------------*"
send "                      --==End of Transmission==--**Q"
waitFor "Command [TL="
IF $CGPSSR
 send "CN4" & $SSRC & "*QQ"
END
waitFor "Command [TL="
goTo :DGUI
:DGUI
# CEO Window Display.
setVar $CCC "**"
IF $CEOWIN=0
 WINDOW CEOSP 525 135 "CEO Security Panel" ONTOP
 setVar $CEOWIN 1
END
IF $CGPSSR
 setVar $CCC $CCC & "     Current SubSpace Channel Selection: " & $SSRC & "*"
END
setVar $CCC $CCC & "             Current Corporate Password: " & $CGPC & "*"
IF $BOTCODEC
 setVar $CCC $CCC & "                       Current BOT Code: " & $BOTCODE & "*"
END
setWindowContents CEOSP $CCC
waitFor "Command [TL="
goTo :CGPCSC
:CIP
getLength $setC $CCountl
IF $CCountl>3
 IF $CCountl=5
  setVar $cut1 2
  setVar $cut2 3
 END
 IF $CCountl=4
  setVar $cut1 1
  setVar $cut2 2
 END
 cutText $setC $CCV1 1 $cut1
 cutText $setC $CCV2 $cut2 3
 setVar $SSRC $CCV1 & "," & $CCV2
 setVar $setC ": " & ANSI_6 & $CCV1 & ANSI_14 & "," & ANSI_6 & $CCV2
 goTo :CCOMP
END
setVar $SSRC $setC
setVar $setC ": " & ANSI_6 & $setC
goTo :CCOMP
:CCOMP
RETURN
:GBC
# BOT Generation Code Process.
setVar $I 1
setVar $ABOTCH ""
getRND $IBOT 8 20
WHILE $I<=$IBOT
 getRND $C 1 3
 IF $C=1
  setVar $ABOTCH $ABOTCH & "A"
 ELSEIF $C=2
  setVar $ABOTCH $ABOTCH & "N"
 ELSE
  IF $I>1
   setVar $ABOTCH $ABOTCH & "S"
  ELSE
    subtract $I 1
  END
 END
add $I 1
END
setVar $C 1
setVar $I 1
setVar $CGPC ""
WHILE $C<=$IBOT
 cutText $ABOTCH $CGP $C 1
 IF $CGP="A"
  goSub :A
  add $I 1
 ELSEIF $CGP="N"
  goSub :N
  add $I 1
 ELSE
  goSub :S
  add $I 1
 END
add $C 1
END
setVar $BOTCODE $CGPC
saveVar $BOTCODE
setVar $BOTCODEC 1
saveVar $BOTCODEC
loadVar $CGPC
IF $CGPCA
 send "T"
 waitFor "Type corporate message ["
 send "                      CONFIDENTIAL AND CLASSIFIED!*"
 send "                  --==Corporate BOT Authentication==--*"
 send "    This included code is to be used exclusively with our designated*"
 send "                        Corporate BOT, thank you.*"
 send "   -------------------------------------------------------------------*"
 send "      Please update our new Corporate BOT Code: " & $BOTCODE & "*"
 send "   -------------------------------------------------------------------*"
 send "                       --==End of Transmission==--**Q"
 waitFor "Command [TL="
END
setVar $CBOT 0
goTo :CGPCSC
:EL1
killTrigger EL1
killTrigger EL2
killTrigger EL3
killTrigger EL4
killTrigger EL5
echo "********************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "      ³                                                   ³*"
echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    S" ANSI_10 "orry" ANSI_2 ", C" ANSI_10 "orporate " ANSI_2 "M" ANSI_10 "embership is " ANSI_2 "R" ANSI_10 "equired" ANSI_2 "." ANSI_9 "    ³*"
echo ANSI_9 "      ³                                                   ³*"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ*****"
echo ANSI_10 "*****  P" ANSI_2 "lease enter your " ANSI_10 "D" ANSI_2 "esignated " ANSI_10 "C" ANSI_2 "orporate " ANSI_10 "N" ANSI_2 "ame" ANSI_10 ": "
getConsoleInput $CNR
IF $CNR=0
 goTo :EL1
END
echo "********************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿**"
echo ANSI_2 "            C" ANSI_10 "onfirm " ANSI_2 "Y" ANSI_10 "our " ANSI_2 "C" ANSI_10 "orporate " ANSI_2 "N" ANSI_10 "ame is to be " ANSI_2 "(" ANSI_10 "Y" ANSI_2 "/" ANSI_10 "N" ANSI_2 ")" ANSI_10 ": " ANSI_14 $CNR "**"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
getConsoleInput $CNRC SINGLEKEY
UPPERCASE $CNRC
IF $CNRC=Y
 send "M" & $CNR & "*Y" & $CGPC & "*Y"
 setVar $NCR 1
 goTo :DTC
ELSE
 goTo :EL1
END
:EL2
killAllTriggers
send "Q"
send #27
echo "********************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "      ³                                                  ³*"
echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    S" ANSI_10 "orry" ANSI_2 ", CEO " ANSI_2 "S" ANSI_10 "tatus is " ANSI_2 "R" ANSI_10 "equired" ANSI_2 ", " ANSI_2 "H" ANSI_10 "alting" ANSI_2 "!" ANSI_9 "    ³*"
echo ANSI_9 "      ³                                                  ³*"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
HALT
:SCIR
killAllTriggers
send "Q"
echo "********************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "      ³                                                                ³*"
echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    S" ANSI_10 "orry" ANSI_2 ", A C" ANSI_10 "onnection with a " ANSI_14 "TWGS " ANSI_2 "is " ANSI_2 "R" ANSI_10 "equired" ANSI_2 ", " ANSI_2 "H" ANSI_10 "alting" ANSI_2 "!" ANSI_9 "    ³*"
echo ANSI_9 "      ³                                                                ³*"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
HALT
:HCGP
killAllTriggers
send #27
echo "********************************"
echo ANSI_1 "      ÚÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "Ä¿*"
echo ANSI_9 "      ³                                                         ³*"
echo ANSI_9 "      ³  " #27 "[5;33m¯" ANSI_2 "    T" ANSI_10 "he " ANSI_2 "CGP " ANSI_10 "has been " ANSI_2 "M" ANSI_10 "anually " ANSI_2 "T" ANSI_10 "erminated" ANSI_2 ", " ANSI_2 "H" ANSI_10 "alting" ANSI_2 "!" ANSI_9 "    ³*"
echo ANSI_9 "      ³                                                         ³*"
echo ANSI_1 "      ÀÄ" ANSI_9 "ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ" ANSI_1 "ÄÙ****************"
HALT
