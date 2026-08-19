using System;

namespace TWXProxy.Core
{
    /// <summary>
    /// Partial class containing trigger command implementations
    /// </summary>
    public partial class ScriptRef
    {
        #region Trigger Command Implementations

        /// <summary>
        /// CMD: SETTEXTLINETRIGGER name label [text]
        /// Creates a trigger that activates when text appears on a complete line.
        /// If text is empty, trigger activates on every line.
        /// </summary>
        private static CmdAction CmdSetTextLineTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string label = parameters[1].Value;
            string value = parameters.Length > 2 ? parameters[2].Value : string.Empty;

            GlobalModules.TriggerDebugLog($"[SETTEXTLINETRIGGER] name='{name}', label='{label}', value='{value}'\n");

            try
            {
                scriptObj.SetTextLineTrigger(name, label, value);
                GlobalModules.TriggerDebugLog($"[SETTEXTLINETRIGGER] Trigger registered successfully\n");
            }
            catch (Exception ex)
            {
                GlobalModules.TriggerDebugLog($"[SETTEXTLINETRIGGER] ERROR: {ex.Message}\n");
                throw new Exception($"Error setting text line trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SETTEXTOUTTRIGGER name label [text]
        /// Creates a trigger that activates when text is sent to the output stream.
        /// Used for intercepting outgoing text before display.
        /// </summary>
        private static CmdAction CmdSetTextOutTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string label = parameters[1].Value;
            string value = parameters.Length > 2 ? parameters[2].Value : string.Empty;

            GlobalModules.TriggerDebugLog($"[SETTEXTOUTTRIGGER] name='{name}', label='{label}', value='{value}'\n");
            try
            {
                scriptObj.SetTextOutTrigger(name, label, value);
                GlobalModules.TriggerDebugLog($"[SETTEXTOUTTRIGGER] Trigger registered successfully\n");
            }
            catch (Exception ex)
            {
                GlobalModules.TriggerDebugLog($"[SETTEXTOUTTRIGGER] ERROR: {ex.Message}\n");
                throw new Exception($"Error setting text out trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SETTEXTTRIGGER name label [text]
        /// Creates a trigger that activates when text appears anywhere in the input stream.
        /// </summary>
        private static CmdAction CmdSetTextTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string label = parameters[1].Value;
            string value = parameters.Length > 2 ? parameters[2].Value : string.Empty;

            GlobalModules.TriggerDebugLog($"[SETTEXTTRIGGER] name='{name}', label='{label}', value='{value}'\n");

            try
            {
                scriptObj.SetTextTrigger(name, label, value);
                GlobalModules.TriggerDebugLog($"[SETTEXTTRIGGER] Trigger registered successfully\n");
            }
            catch (Exception ex)
            {
                GlobalModules.TriggerDebugLog($"[SETTEXTTRIGGER] ERROR: {ex.Message}\n");
                throw new Exception($"Error setting text trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SETDELAYTRIGGER name label delay
        /// Creates a timer-based trigger that activates after specified milliseconds.
        /// </summary>
        private static CmdAction CmdSetDelayTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string label = parameters[1].Value;
            int delay = (int)parameters[2].DecValue;

            try
            {
                scriptObj.SetDelayTrigger(name, label, delay);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error setting delay trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SETEVENTTRIGGER name label event [param]
        /// Creates an event-based trigger that activates on specific game events.
        /// Events include: TIME HIT, WARP, PORT, PLANET, etc.
        /// </summary>
        private static CmdAction CmdSetEventTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string label = parameters[1].Value;
            string eventName = parameters[2].Value;
            string param = parameters.Length > 3 ? parameters[3].Value : string.Empty;

            try
            {
                scriptObj.SetEventTrigger(name, label, eventName, param);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error setting event trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SETAUTOTRIGGER name text response [lifecycle]
        /// Creates an automatic trigger that sends a response when text is matched.
        /// Lifecycle: number of times trigger will fire before auto-removal (0 = infinite).
        /// </summary>
        private static CmdAction CmdSetAutoTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;
            string text = parameters[1].Value;
            string response = parameters[2].Value;
            int lifecycle = parameters.Length > 3 ? (int)parameters[3].DecValue : 1;

            try
            {
                scriptObj.SetAutoTrigger(name, text, response, lifecycle);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error setting auto trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: KILLTRIGGER name
        /// Removes a specific trigger by name.
        /// </summary>
        private static CmdAction CmdKillTrigger_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            string name = parameters[0].Value;

            try
            {
                scriptObj.KillTrigger(name);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error killing trigger: {ex.Message}");
            }

            return CmdAction.None;
        }

        /// <summary>
        /// CMD: KILLALLTRIGGERS
        /// Removes all triggers from the current script.
        /// </summary>
        private static CmdAction CmdKillAllTriggers_Impl(object script, CmdParam[] parameters)
        {
            if (script is not Script scriptObj)
                return CmdAction.None;

            try
            {
                scriptObj.KillAllTriggers();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error killing all triggers: {ex.Message}");
            }

            return CmdAction.None;
        }

        #endregion
    }
}
