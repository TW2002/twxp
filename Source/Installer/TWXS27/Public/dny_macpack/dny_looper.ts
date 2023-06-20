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

:script_start

     setVar $timeout_count 30
     setVar $description_comment "Comment or description goes here..."
     setVar $times_to_loop 5
     setVar $macro_text ""
     setVar $file_loaded ""
     setVar $trigger_text "n/a"

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

     # Set and clear loaded file
     loadVar $dny_mac
     if ($dny_mac <> "")
           setVar $file_loaded $dny_mac
           setVar $dny_mac ""
           saveVar $dny_mac
           goto :load_file_now
     end

# End of start.


:main_menu
     # Make macro printable.
     replaceText $macro_text #42 "^M"
     replacetext $macro_text #126 "^M"

     # Print menu.

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

     echo ANSI_5 "*--------------- " ANSI_12 "Dnyarri's macro looper script" ANSI_5 " --------------*"
     echo ANSI_11 "M" ANSI_9 "acro to run.*"
     echo ANSI_10 "      Currently: " ANSI_15 $macro_text "*"
     echo ANSI_11 "T" ANSI_9 "imes to loop.*"
     echo ANSI_10 "      Currently: " ANSI_15 $times_to_loop "*"
     echo ANSI_11 "D" ANSI_9 "escription or comment:*"
     echo ANSI_10 "      Currently: " ANSI_15 $description_comment "*"
     echo ANSI_11 "V" ANSI_9 "ariable descriptions.*"
     echo ANSI_11 "S" ANSI_9 "ave to file.*"
     echo ANSI_11 "L" ANSI_9 "oad from file.**"
     echo ANSI_11 "R" ANSI_9 "un loops.*"
     echo ANSI_11 "Q" ANSI_9 "uit.*"
     if ($file_loaded <> "") AND ($file_loaded <> 0)
           echo ANSI_10 "      Currently: " ANSI_15 $file_loaded "*"
     end
     echo ANSI_5 "------------------------------------------------------------*"
     

     getConsoleInput $chosen_option SINGLEKEY
     upperCase $chosen_option

     if ($chosen_option = "T")
            getinput $times_to_loop "Times to loop: "
            goto :main_menu
     end

     if ($chosen_option = "M")
            getinput $macro_text "Macro (max 255 chars): "
            goto :main_menu
     end

     if ($chosen_option = "D")
            getinput $description_comment "Description or comment: "
            goto :main_menu
     end

     if ($chosen_option = "V")
            goto :variable_description_menu
     end

     if ($chosen_option = "S")
            getinput $file_loaded "Save as (will overwrite any existing file): "

            # File format: 
            # MACRO - dnyarri macro trigger
            # comment field
            # timeout
            # trigger
            # loops
            # macro
            # desc 0 thru 9

            setVar $file_error 0
            if ($file_loaded <> "") AND ($file_loaded <> 0)
                 delete $file_loaded
                 write $file_loaded "MACRO - dnyarri macro looper"
                 write $file_loaded $description_comment
                 write $file_loaded $timeout_count
                 write $file_loaded $trigger_text
                 write $file_loaded $times_to_loop
                 write $file_loaded $macro_text
                 write $file_loaded $macro_var_desc_0
                 write $file_loaded $macro_var_desc_1
                 write $file_loaded $macro_var_desc_2
                 write $file_loaded $macro_var_desc_3
                 write $file_loaded $macro_var_desc_4
                 write $file_loaded $macro_var_desc_5
                 write $file_loaded $macro_var_desc_6
                 write $file_loaded $macro_var_desc_7
                 write $file_loaded $macro_var_desc_8
                 write $file_loaded $macro_var_desc_9
            else
                 setVar $file_error 1
            end

            if ($file_error = 1)
                 echo "*" ANSI_12 "Error! Could not save file: " ANSI_15 $file_loaded "*"
                 setVar $file_loaded ""
            end

            goto :main_menu
     end

     if ($chosen_option = "L")
            getinput $file_loaded "File to load: "

            :load_file_now

            # File format: 
            # MACRO - dnyarri macro trigger
            # comment field
            # timeout
            # trigger
            # loops
            # macro
            # desc 0 thru 0

            setVar $file_error 0
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
                               echo "**" ANSI_10 "File loaded!*"
                        else
                               # Not a macro file.                               echo "**" ANSI_12 "That file is not a macro file!"
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
            end

            goto :main_menu
     end
     
     if ($chosen_option = "Q")
           # echo ANSI_11 "*Bye!*"
           goto :loop_done
     end

     if ($chosen_option = "R")
           # Check some bounds
           if ($times_to_loop < 1)
               echo "**" ANSI_12 "Loops must be atleast 1!*"
               goto :main_menu
           end
    
           if ($macro_text = "")
               echo "**" ANSI_12 "You must enter a macro!*"
               goto :main_menu
           end

           # Script should work with both * and ^M
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
           goto :loop_it
     end
goto :main_menu

:loop_it
     # End of input checking, start the loops...
     send "'-==[ Dny looper ]==-   |   Running " & $times_to_loop & " loops.*"

     setVar $i 1
# Ready for the loop.

:loopy
     if ($i > $times_to_loop)
            goto :loop_done
     end

     # Load script?
     setVar $typed 0
     getWordPos $macro_text $pos ".ts"
     if ($pos > 0)
            setVar $typed 1
            load $macro_text
     end
     getWordPos $macro_text $pos ".cts"
     if ($pos > 0)
            setVar $typed 1
            load $macro_text
     end
     getWordPos $macro_text $pos ".ets"
     if ($pos > 0)
            setVar $typed 1
            load $macro_text
     end

     # Not a script.
     if ($typed = 0)
         processOut $macro_text
     end

     add $i 1
goto :loopy

:loop_done
     send "'-==[ Dny looper exited ]==-*"
     # Exit
halt

:variable_description_menu
       echo ANSI_5 "*------------------- " ANSI_4 "Variable descriptions" ANSI_5 " ------------------*"
       echo ANSI_12 "*                 -= DO NOT FORGET TO SAVE =- **"
       echo ANSI_11 "0" ANSI_9 " - " ANSI_2 $macro_var_desc_0 "*"
       echo ANSI_11 "1" ANSI_9 " - " ANSI_2 $macro_var_desc_1 "*"
       echo ANSI_11 "2" ANSI_9 " - " ANSI_2 $macro_var_desc_2 "*"
       echo ANSI_11 "3" ANSI_9 " - " ANSI_2 $macro_var_desc_3 "*"
       echo ANSI_11 "4" ANSI_9 " - " ANSI_2 $macro_var_desc_4 "*"
       echo ANSI_11 "5" ANSI_9 " - " ANSI_2 $macro_var_desc_5 "*"
       echo ANSI_11 "6" ANSI_9 " - " ANSI_2 $macro_var_desc_6 "*"
       echo ANSI_11 "7" ANSI_9 " - " ANSI_2 $macro_var_desc_7 "*"
       echo ANSI_11 "8" ANSI_9 " - " ANSI_2 $macro_var_desc_8 "*"
       echo ANSI_11 "9" ANSI_9 " - " ANSI_2 $macro_var_desc_9 "*"
       echo ANSI_11 "*Q" ANSI_9 "uit and return to main menu.*"
       echo ANSI_5 "------------------------------------------------------------*"

       getConsoleInput $chosen_option SINGLEKEY
       upperCase $chosen_option

       if ($chosen_option = "Q")
              goto :main_menu
       end

       if ($chosen_option = "0")
              getinput $macro_var_desc_0 "Description for variable %0: "
              goto :variable_description_menu
       end
       if ($chosen_option = "1")
              getinput $macro_var_desc_1 "Description for variable %1: "
              goto :variable_description_menu
       end
       if ($chosen_option = "2")
              getinput $macro_var_desc_2 "Description for variable %2: "
              goto :variable_description_menu
       end
       if ($chosen_option = "3")
              getinput $macro_var_desc_3 "Description for variable %3: "
              goto :variable_description_menu
       end
       if ($chosen_option = "4")
              getinput $macro_var_desc_4 "Description for variable %4: "
              goto :variable_description_menu
       end
       if ($chosen_option = "5")
              getinput $macro_var_desc_5 "Description for variable %5: "
              goto :variable_description_menu
       end
       if ($chosen_option = "6")
              getinput $macro_var_desc_6 "Description for variable %6: "
              goto :variable_description_menu
       end
       if ($chosen_option = "7")
              getinput $macro_var_desc_7 "Description for variable %7: "
              goto :variable_description_menu
       end
       if ($chosen_option = "8")
              getinput $macro_var_desc_8 "Description for variable %8: "
              goto :variable_description_menu
       end
       if ($chosen_option = "9")
              getinput $macro_var_desc_9 "Description for variable %9: "
              goto :variable_description_menu
       end
goto :variable_description_menu
  