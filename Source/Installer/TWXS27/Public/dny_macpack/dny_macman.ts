# -------------------------------------------------------------------
# Dnyarri macro pack scripts by Aaron Colman, aaron@ibasics.biz.
#
# This script is released under the GPL on August 7th, 2005
# Go here for the license: http://www.gnu.org/copyleft/gpl.html
#
# Basically it means 3 things.
# 1. You can edit and use the scripts as you wish provded that:
# 2. You release the source code for any changes and
# 3. Give credit to the original author(s) in any such mods
#
# Version 2.0 of the macpack includes the macro runner, the macro
# looper, the macro trigger and the macro manager scripts. Each
# can save files, load files and handle up to 10 variables.
# -------------------------------------------------------------------

# -------------------------------------------------------------
# Config vars you can play with...
setVar $load_other_file ""
setVar $bind_to_key ""
# -------------------------------------------------------------


# -------------------------------------------------------------
# Colors:
# 1 is dark blue
# 2 is dark green
# 3 is dark cyan
# 4 is dark red
# 5 is dark purple
# 6 is dirty yello
# 7 is light grey
# 8 is dark grey
# 9 is light blue
# 10 is light green
# 11 is cyan
# 12 is red.
# 13 is light purple
# 14 is yellow
# 15 is white
# -------------------------------------------------------------

:prog_start

# Clear saved mac file 
setVar $dny_mac ""
saveVar $dny_mac

if ($bind_to_key <> "")
      SetTextOutTrigger man_it :start_process $bind_to_key
      pause
end

:start_process

setVar $general_file "default_macros.ini"
setVar $specific_file GAMENAME & "_macros.ini"

setVar $key_array[1]  "0"
setVar $key_array[2]  "1"
setVar $key_array[3]  "2"
setVar $key_array[4]  "3"
setVar $key_array[5]  "4"
setVar $key_array[6]  "5"
setVar $key_array[7]  "6"
setVar $key_array[8]  "7"
setVar $key_array[9]  "8"
setVar $key_array[10] "9"
setVar $key_array[11] "A"
setVar $key_array[12] "B"
setVar $key_array[13] "C"
setVar $key_array[14] "D"
setVar $key_array[15] "E"
setVar $key_array[16] "F"
setVar $key_array[17] "G"
setVar $key_array[18] "H"
setVar $key_array[19] "I"
setVar $key_array[20] "J"
setVar $key_array[21] "K"
setVar $key_array[22] "L"
setVar $key_array[23] "M"
setVar $key_array[24] "N"
setVar $key_array[25] "O"
setVar $key_array[26] "P"
setVar $key_array[27] "Q"
setVar $key_array[28] "R"
setVar $key_array[29] "S"
setVar $key_array[30] "T"
setVar $key_array[31] "U"
setVar $key_array[32] "V"
setVar $key_array[33] "W"
setVar $key_array[34] "X"
setVar $key_array[35] "Y"
setVar $key_array[36] "Z"

# Init the array with blanks
while ($key_idx <= 36)
    setVar $keyball $key_array[$key_idx]
    # 1 is desc. 2 is file.
    setVar $macro_array[$keyball][1] ""
    setVar $macro_array[$keyball][2] ""
    add $key_idx 1
end

gosub :read_general_file
gosub :read_specific_file

if ($load_other_file <> "") AND ($load_other_file <> 0)
       setVar $specific_file $load_other_file
       gosub :read_specific_file
end

:menu
    echo ANSI_11 "*Mac Man " & ANSI_9 & "(@ = Exit, ? = Help)"
    getConsoleInput $chosen_option SINGLEKEY
    upperCase $chosen_option

    :parse_menu
    if ($chosen_option = "?")
           setVar $key_idx 1
           echo "*" ANSI_14
           while ($key_idx <= 18)
                  setVar $keyball $key_array[$key_idx]
                  if ($macro_array[$keyball][2] <> "") AND ($macro_array[$keyball][2] <> 0)
                        echo ANSI_8 "[" ANSI_15 $keyball ANSI_8 "]" ANSI_14 "  " & $macro_array[$keyball][1] "*"
                  end
                  add $key_idx 1
           end
           echo "*" ANSI_13
           echo "? = Last page*"
           echo "! = Edit macro list*"
           echo "^ = Load macro list"
           echo ANSI_11 "*Mac Man " ANSI_9 "(@ = Exit)"
           getConsoleInput $chosen_option SINGLEKEY
           upperCase $chosen_option
            
           if ($chosen_option = "?") OR ($chosen_option = "+")
                 setVar $key_idx 19
                 echo "*" ANSI_14
                 while ($key_idx <= 36)
                      setVar $keyball $key_array[$key_idx]
                      if ($macro_array[$keyball][2] <> "") AND ($macro_array[$keyball][2] <> 0)
                            echo ANSI_8 "[" ANSI_15 $keyball ANSI_8 "]" ANSI_14 "  " & $macro_array[$keyball][1] "*"
                      end
                      add $key_idx 1
                 end

                 echo "*" ANSI_13
                 echo "? = Last page*"
                 echo "! = Edit macro list*"
                 echo "^ = Load macro list"
                 echo ANSI_11 "*Mac Man " ANSI_9 "(@ = Exit)"
                 echo "Mac Man (@ = Exit)"
                 getConsoleInput $chosen_option SINGLEKEY
                 upperCase $chosen_option
                 goto :parse_menu
           else
                 goto :parse_menu
           end

     elseif ($chosen_option = "@")
           goto :endie

     elseif ($chosen_option = "!")
           # Edit / Save either global or game-specific

           :edit_menu

           echo ANSI_13 "*Mac list edit:*"
           echo ANSI_8 "(" ANSI_11 "Q" ANSI_8 ")" ANSI_9 "uit back to main**"

           echo ANSI_12 "Edit which:*"
           echo ANSI_8 "(" ANSI_11 "G" ANSI_8 ")" ANSI_9 "lobal*"
           echo ANSI_8 "(" ANSI_11 "S" ANSI_8 ")" ANSI_9 "pecific*"
           echo ANSI_8 "(" ANSI_11 "O" ANSI_8 ")" ANSI_9 "ther**"

           echo ANSI_12 "Load script:*"
           echo ANSI_8 "(" ANSI_11 "R" ANSI_8 ")" ANSI_9 "unner*"
           echo ANSI_8 "(" ANSI_11 "L" ANSI_8 ")" ANSI_9 "ooper*"
           echo ANSI_8 "(" ANSI_11 "T" ANSI_8 ")" ANSI_9 "rigger*"

           echo ANSI_10 "*Choice?"
           getConsoleInput $chosen_option SINGLEKEY
           upperCase $chosen_option

           if ($chosen_option = "Q") OR ($chosen_option = "@")
                  goto :start_process
           elseif ($chosen_option = "G")
                  setVar $file_to_read "default_macros.ini"
                  gosub :file_editor
                  goto :start_process
           elseif ($chosen_option = "S")
                  setVar $file_to_read GAMENAME & "_macros.ini"
                  gosub :file_editor
                  goto :start_process
           elseif ($chosen_option = "O")
                  getinput $file_to_read "File: "
                  gosub :file_editor
           elseif ($chosen_option = "R")
                  setTextLineTrigger dny_runner_done :edit_menu "-==[ Dny macro exited ]==-"
                  load dny_macro
                  pause
                  # goto :menu
           elseif ($chosen_option = "L")
                  setTextLineTrigger dny_looper_done :edit_menu "-==[ Dny looper exited ]==-"
                  load dny_looper
                  pause
                  # goto :menu
           elseif ($chosen_option = "T")
                  setTextLineTrigger dny_trigger_done1 :edit_menu "-==[ Dny trigger started ]==-"
                  setTextLineTrigger dny_trigger_done2 :edit_menu "-==[ Dny trigger completed ]==-"

                  load dny_trigger
                  pause
                  # goto :menu
           else
                  echo "*Invalid selection*"
                  goto :edit_menu
           end
          
           # Do you want to load this version now?
 
     elseif ($chosen_option = "^")
           # Load new file
           getinput $load_file "File: "
           if ($load_file <> "")
                  setVar $specific_file $load_file
                  gosub :read_specific_file
                  if ($file_success = 1)
                         echo "*" & ANSI_10 & "File loaded!*"
                  end
           end
     else
           if ($bind_to_key <> "")
                 if ($chosen_option = $bind_to_key)
                       goto :endie
                 end
           end

           setVar $good_press 0
           setVar $key_idx 1
           while ($key_idx <= 36)
                 setVar $keyball $key_array[$key_idx]
                 if ($keyball = $chosen_option)
                       setVar $good_press 1
                       goto :done_testing
                 end

                 add $key_idx 1
           end

           :done_testing
           if ($good_press = 1)
                 gosub :run_it
                 goto :endie
           end
     end
goto :menu

:endie
if ($bind_to_key <> "")
     killalltriggers
     goto :prog_start       
else
     send "/"
     halt
end


:read_specific_file
     setVar $file_error 0
     setVar $file_success 0
            if ($specific_file <> "") AND ($specific_file <> 0)
                 fileExists $exists $specific_file
                 if ($exists)
                        read $specific_file $line_1 1
                        getWordPos $line_1 $pos "MACRO"
                        if ($pos > 0)
                               # Format looks good... let's load
                               setVar $key_idx 1
                               while ($key_idx <= 36)
                                     setVar $key_loc  ($key_idx * 3) - 1
                                     setVar $desc_loc ($key_idx * 3)
                                     setVar $mac_loc  ($key_idx * 3) + 1

                                     # 1 is desc. 2 is file.
                                     read $specific_file $keyball $key_loc
                                     read $specific_file $desc_temp $desc_loc
                                     read $specific_file $mac_temp $mac_loc
                                     setVar $macro_array[$keyball][1] $desc_temp
                                     setVar $macro_array[$keyball][2] $mac_temp

                                     # Clear up any blank issues we have.
                                     if ($macro_array[$keyball][1] = 0)
                                          setVar $macro_array[$keyball][1] ""
                                     end
                                     if ($macro_array[$keyball][2] = 0)
                                          setVar $macro_array[$keyball][2] ""
                                     end

                                     add $key_idx 1
                               end

                               setVar $file_success 1
                        end
                 else
                        # Write a blank file.
                        write $specific_file "MACRO - dnyarri macro manager"
                        while ($key_idx <= 36)
                              setVar $keyball $key_array[$key_idx]
                              write $specific_file $keyball
                              write $specific_file $macro_array[$keyball][1]
                              write $specific_file $macro_array[$keyball][2]
                              add $key_idx 1
                        end
                 end
            end
return 


:read_general_file
     setVar $file_error 0
            if ($general_file <> "") AND ($general_file <> 0)
                 fileExists $exists $general_file
                 if ($exists)
                        read $general_file $line_1 1
                        getWordPos $line_1 $pos "MACRO"
                        if ($pos > 0)
                               # Format looks good... let's load
                               setVar $key_idx 1
                               while ($key_idx <= 36)
                                     setVar $key_loc  ($key_idx * 3) - 1
                                     setVar $desc_loc ($key_idx * 3)
                                     setVar $mac_loc  ($key_idx * 3) + 1

                                     # 1 is desc. 2 is file.
                                     read $general_file $keyball $key_loc
                                     read $general_file $macro_array[$keyball][1] $desc_loc
                                     read $general_file $macro_array[$keyball][2] $mac_loc

                                     # Clear up any blank issues we have.
                                     if ($macro_array[$keyball][1] = 0)
                                          setVar $macro_array[$keyball][1] ""
                                     end
                                     if ($macro_array[$keyball][2] = 0)
                                          setVar $macro_array[$keyball][2] ""
                                     end
                                     add $key_idx 1
                               end
                        end
                 else
                        # Write a blank file.
                        write $general_file "MACRO - dnyarri macro manager"
                        setVar $key_idx 1
                        while ($key_idx <= 36)
                              setVar $keyball $key_array[$key_idx]
                              write $general_file $keyball
                              write $general_file $macro_array[$keyball][1]
                              write $general_file $macro_array[$keyball][2]
                              add $key_idx 1
                        end
                 end
            end
return


:run_it
                  setVar $desc $macro_array[$chosen_option][1]
                  setVar $mac  $macro_array[$chosen_option][2]
                  setVar $typed 0

                  if ($mac = "") OR ($mac = 0)
                         echo "*Invalid selection*"
                         goto :menu
                  end

                  getWordPos $mac $pos ".ts"
                  if ($pos > 0)
                         setVar $typed 1
                         load $mac 
                  end

                  getWordPos $mac $pos ".cts"
                  if ($pos > 0)
                         setVar $typed 1
                         load $mac
                  end

                  getWordPos $mac $pos ".ets"
                  if ($pos > 0)
                         setVar $typed 1
                         load $mac
                  end

                  # Fedcom, subspace, hail, message, corp memo, echo.
                  # getWordPos $mac $pos ".txt"
                  # if ($pos > 0)
                  #        setVar $typed 1
                  #        load $mac
                  #
                  # In a future version, output to local, SS, Fed, corp memo, personal
                  # memo, announce, hail and processOut.
                  #
                  # end

                  getWordPos $mac $pos ".mac"
                  if ($pos > 0)

                         setVar $typed 1
                         setVar $timeout_count 30
                         setVar $description_comment "Comment or description goes here..."
                         setVar $times_to_loop 5
                         setVar $macro_text ""
                         setVar $file_loaded ""
                         setVar $trigger_text ""
 
                         # Looper or trigger? Run appropriate scripts...
                         getWord $mac $first_word 1
                         getWord $mac $second_word 2
                         upperCase $first_word
                         if ($first_word = "TRIGGER")
                               setVar $dny_mac $second_word
                               saveVar $dny_mac

                               setTextLineTrigger dny_trigger_done1 :endie "-==[ Dny trigger started ]==-"
                               setTextLineTrigger dny_trigger_done2 :endie "-==[ Dny trigger completed ]==-"

                               load dny_trigger
                               pause
                         elseif ($first_word = "LOOP") OR ($first_word = "LOOPER")
                               setVar $dny_mac $second_word
                               saveVar $dny_mac

                               setTextLineTrigger dny_looper_done :endie "-==[ Dny looper exited ]==-"
                               load dny_looper
                               pause
                         end

                         # Niether looper nor trigger

                         # An array is too much hassle for 10 elements...
                         setVar $macro_var_0 ""
                         setVar $macro_var_desc_0 "Variable %0"
                         setVar $macro_var_1 ""
                         setVar $macro_var_desc_1 "Variable %1"
                         setVar $macro_var_2 ""
                         setVar $macro_var_desc_2 "Variable %2"
                         setVar $macro_var_3 ""
                         setVar $macro_var_desc_3 "Variable %3"
                         setVar $macro_var_4 ""
                         setVar $macro_var_desc_4 "Variable %4"
                         setVar $macro_var_5 ""
                         setVar $macro_var_desc_5 "Variable %5"
                         setVar $macro_var_6 ""
                         setVar $macro_var_desc_6 "Variable %6"
                         setVar $macro_var_7 ""
                         setVar $macro_var_desc_7 "Variable %7"
                         setVar $macro_var_8 ""
                         setVar $macro_var_desc_8 "Variable %8"
                         setVar $macro_var_9 ""
                         setVar $macro_var_desc_9 "Variable %9"

                         # Load file and stuff...
                         setVar $file_error 0
                         setVar $file_loaded $mac
                         if ($file_loaded <> "") AND ($file_loaded <> 0)
                               fileExists $exists $file_loaded
                               if ($exists)
                                      read $file_loaded $line_1 1
                                      getWordPos $line_1 $pos "MACRO"
                                      if ($pos > 0)
                                             # Format looks good... let's load
                                             read $file_loaded $description_comment 2
                                             read $file_loaded $timeout_count 3
                                             read $file_loaded $trigger_text 4
                                             read $file_loaded $times_to_loop 5
                                             read $file_loaded $macro_text 6
                                             read $file_loaded $macro_var_desc_0 7
                                             read $file_loaded $macro_var_desc_1 8
                                             read $file_loaded $macro_var_desc_2 9
                                             read $file_loaded $macro_var_desc_3 10
                                             read $file_loaded $macro_var_desc_4 11
                                             read $file_loaded $macro_var_desc_5 12
                                             read $file_loaded $macro_var_desc_6 13
                                             read $file_loaded $macro_var_desc_7 14
                                             read $file_loaded $macro_var_desc_8 15
                                             read $file_loaded $macro_var_desc_9 16
                                             echo "**" ANSI_12 "File loaded!*"
                                      else
                                             # Not a macro file.
                                             echo "**" ANSI_12 "That file is not a macro file!"
                                             setVar $file_error 1
                                      end
                               else
                                      setVar $file_error 1               
                               end
                         else 
                               setVar $file_error 1
                         end

                         if ($file_error = 1)
                               echo "**" ANSI_12 "Error! Could not load file: " ANSI_15 $file_loaded "*"
                               setVar $file_loaded ""
                               goto :menu
                         end
    
                         # File loaded!
                         replaceText $macro_text #42 "^M"
                         replacetext $macro_text #126 "^M"
                         echo ANSI_10 "Running: " & $desc & "*"
                         echo ANSI_8 "(" & ANSI_8 & $file_loaded & ANSI_8 ")*"
                         echo ANSI_13 "Macro: " & ANSI_9 & $macro_text & "*"
 
                         # Script should work with *, ~ and ^M
                         replaceText $macro_text "^M" "*"

                         # Get variable input
                         getWordPos $macro_text $pos "%0"
                         getWordPos $trigger_text $tpos "%0"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_0 $macro_var_desc_0
                         end
                         getWordPos $macro_text $pos "%1"
                         getWordPos $trigger_text $tpos "%1"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_1 $macro_var_desc_1
                         end
                         getWordPos $macro_text $pos "%2"
                         getWordPos $trigger_text $tpos "%2"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_2 $macro_var_desc_2
                         end
                         getWordPos $macro_text $pos "%3"
                         getWordPos $trigger_text $tpos "%3"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_3 $macro_var_desc_3
                         end
                         getWordPos $macro_text $pos "%4"
                         getWordPos $trigger_text $tpos "%4"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_4 $macro_var_desc_4
                         end
                         getWordPos $macro_text $pos "%5"
                         getWordPos $trigger_text $tpos "%5"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_5 $macro_var_desc_5
                         end
                         getWordPos $macro_text $pos "%6"
                         getWordPos $trigger_text $tpos "%6"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_6 $macro_var_desc_6
                         end
                         getWordPos $macro_text $pos "%7"
                         getWordPos $trigger_text $tpos "%7"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_7 $macro_var_desc_7
                         end
                         getWordPos $macro_text $pos "%8"
                         getWordPos $trigger_text $tpos "%8"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_8 $macro_var_desc_8
                         end
                         getWordPos $macro_text $pos "%9"
                         getWordPos $trigger_text $tpos "%9"
                         if ($pos > 0) OR ($tpos > 0)
                              getinput $macro_var_9 $macro_var_desc_9
                         end

                         # Compile variables
                         replaceText $macro_text "%0" $macro_var_0
                         replaceText $macro_text "%1" $macro_var_1
                         replaceText $macro_text "%2" $macro_var_2
                         replaceText $macro_text "%3" $macro_var_3
                         replaceText $macro_text "%4" $macro_var_4
                         replaceText $macro_text "%5" $macro_var_5
                         replaceText $macro_text "%6" $macro_var_6
                         replaceText $macro_text "%7" $macro_var_7
                         replaceText $macro_text "%8" $macro_var_8
                         replaceText $macro_text "%9" $macro_var_9
                         replaceText $trigger_text "%0" $macro_var_0
                         replaceText $trigger_text "%1" $macro_var_1
                         replaceText $trigger_text "%2" $macro_var_2
                         replaceText $trigger_text "%3" $macro_var_3
                         replaceText $trigger_text "%4" $macro_var_4
                         replaceText $trigger_text "%5" $macro_var_5
                         replaceText $trigger_text "%6" $macro_var_6
                         replaceText $trigger_text "%7" $macro_var_7
                         replaceText $trigger_text "%8" $macro_var_8
                         replaceText $trigger_text "%9" $macro_var_9

                         # Execute macro
                         processOut $macro_text
                  end

                  if ($typed = 0)
                         replaceText $mac #42 "^M"
                         replacetext $mac #126 "^M"
                         echo ANSI_9 & "*Running macro: " & ANSI_14 & $mac & "*"

                         # Get variable input
                         getWordPos $mac $pos "%0"
                         if ($pos > 0)
                              getinput $macro_var_0 "Variable 0: "
                         end
                         getWordPos $mac $pos "%1"
                         if ($pos > 0)
                              getinput $macro_var_1 "Variable 1: "
                         end
                         getWordPos $mac $pos "%2"
                         if ($pos > 0)
                              getinput $macro_var_2 "Variable 2: "
                         end
                         getWordPos $mac $pos "%3"
                         if ($pos > 0)
                              getinput $macro_var_3 "Variable 3: "
                         end
                         getWordPos $mac $pos "%4"
                         if ($pos > 0)
                              getinput $macro_var_4 "Variable 4: "
                         end
                         getWordPos $mac $pos "%5"
                         if ($pos > 0)
                              getinput $macro_var_5 "Variable 5: "
                         end
                         getWordPos $mac $pos "%6"
                         if ($pos > 0)
                              getinput $macro_var_6 "Variable 6: "
                         end
                         getWordPos $mac $pos "%7"
                         if ($pos > 0)
                              getinput $macro_var_7 "Variable 7: "
                         end
                         getWordPos $mac $pos "%8"
                         if ($pos > 0)
                              getinput $macro_var_8 "Variable 8: "
                         end
                         getWordPos $mac $pos "%9"
                         if ($pos > 0)
                              getinput $macro_var_9 "Variable 9: "
                         end

                         # Compile variables
                         replaceText $mac "%0" $macro_var_0
                         replaceText $mac "%1" $macro_var_1
                         replaceText $mac "%2" $macro_var_2
                         replaceText $mac "%3" $macro_var_3
                         replaceText $mac "%4" $macro_var_4
                         replaceText $mac "%5" $macro_var_5
                         replaceText $mac "%6" $macro_var_6
                         replaceText $mac "%7" $macro_var_7
                         replaceText $mac "%8" $macro_var_8
                         replaceText $mac "%9" $macro_var_9

                         # Convert them all to twx cr.
                         replaceText $mac "^M" "*"

                         send $mac
                  end
return


:file_editor
      setVar $file_error 0
      if ($file_to_read <> "") AND ($file_to_read <> 0)
            # Init the array with blanks
            while ($key_idx <= 36)
                   setVar $keyball $key_array[$key_idx]
                   # 1 is desc. 2 is file.
                   setVar $file_macro_array[$keyball][1] ""
                   setVar $file_macro_array[$keyball][2] ""
                   add $key_idx 1
            end

            fileExists $exists $file_to_read
            if ($exists)
                    read $file_to_read $line_1 1
                    getWordPos $line_1 $pos "MACRO"
                    if ($pos > 0)
                           # Format looks good... let's load
                           setVar $key_idx 1
                           while ($key_idx <= 36)
                                 setVar $key_loc  ($key_idx * 3) - 1
                                 setVar $desc_loc ($key_idx * 3)
                                 setVar $mac_loc  ($key_idx * 3) + 1

                                 # 1 is desc. 2 is file.
                                 read $file_to_read $keyball $key_loc
                                 read $file_to_read $file_macro_array[$keyball][1] $desc_loc
                                 read $file_to_read $file_macro_array[$keyball][2] $mac_loc
                                 add $key_idx 1
                           end
                    end
              else
                    # Write a blank file.
                    write $file_to_read "MACRO - dnyarri macro manager"
                    setVar $key_idx 1
                    while ($key_idx <= 36)
                              setVar $keyball $key_array[$key_idx]
                              write $file_to_read $keyball
                              write $file_to_read $file_macro_array[$keyball][1]
                              write $file_to_read $file_macro_array[$keyball][2]
                              add $key_idx 1
                    end
               end      
      else
            echo "File not selected!"
            goto :edit_menu
      end

      :init_editor
            setVar $key_idx_start 1
            setVar $key_idx_end 18

      :editor_menu
            echo "*"
            setVar $key_idx $key_idx_start
            while ($key_idx <= $key_idx_end)
                   setVar $keyball $key_array[$key_idx]
                   echo ANSI_8 "[" ANSI_15 $keyball ANSI_8 "]" ANSI_14 "  " & $file_macro_array[$keyball][1] "*"
                   # echo "  " $file_macro_array[$keyball][2] "*"
                   add $key_idx 1
            end
            echo ANSI_9 "*+ = Next/Prev page. Type the key you want to change.*"
            echo ANSI_11 "Macro Editor " ANSI_9 "(@ = Exit, ^ = Save)"
            getConsoleInput $chosen_option SINGLEKEY
            upperCase $chosen_option

      :list_macros
            if ($chosen_option = "@")
                goto :edit_menu
            elseif ($chosen_option = "^")
                delete $file_to_read
                write $file_to_read "MACRO - dnyarri macro manager"
                setVar $key_idx 1
                while ($key_idx <= 36)
                      setVar $keyball $key_array[$key_idx]
                      write $file_to_read $keyball
                      write $file_to_read $file_macro_array[$keyball][1]
                      write $file_to_read $file_macro_array[$keyball][2]
                      add $key_idx 1
                end
                echo "*File saved!*"
                gosub :read_general_file
                gosub :read_specific_file
                if ($load_other_file <> "") AND ($load_other_file <> 0)
                     setVar $specific_file $load_other_file
                     gosub :read_specific_file
                end
                setVar $chosen_option "?"
                goto :parse_menu
            elseif ($chosen_option = "+")
                if ($key_idx_start = 1)
                      setVar $key_idx_start 19
                      setVar $key_idx_end 36
                else
                      setVar $key_idx_start 1
                      setVar $key_idx_end 18
                end               
                goto :editor_menu
            else
                setVar $good_press 0
                setVar $key_idx 1
                while ($key_idx <= 36)
                      setVar $keyball $key_array[$key_idx]
                      if ($keyball = $chosen_option)
                            setVar $good_press 1
                            goto :done_testing_edit
                      end
                      add $key_idx 1
                end
      
                :done_testing_edit
                if ($good_press = 1)
                      echo ANSI_15 "*Prefix with LOOPER or TRIGGER to run as looper or trigger, eg:*"
                      echo ANSI_15 "LOOPER myloop.mac*"
                      echo ANSI_15 "Would run myloop.mac in dny looper.**"
                      echo ANSI_13 "A .ts, .cts or .ets file will load as a script.*"
                      echo ANSI_11 "A .mac file will load as a macro format file.*"
                      # echo "A .txt file will load with various output options.*"
                      echo ANSI_12 "Everything else will be treated as a burst macro.*"

                      echo "*"
                      echo ANSI_14 "Currently:*"
                      echo ANSI_11 "Macro: " ANSI_12 $file_macro_array[$keyball][1] "*"
                      echo ANSI_11 "Desc: " ANSI_12 $file_macro_array[$keyball][2] "*"

                      getinput $desco "Description: "
                      getinput $maco "Macro: "

                      setVar $file_macro_array[$keyball][1] $desco
                      setVar $file_macro_array[$keyball][2] $maco
                      goto :editor_menu
                else
                      echo "*Invalid selection!"
                      goto :editor_menu
                end
      end
return
