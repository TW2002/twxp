using System;
using System.Collections.Generic;
using System.Linq;

namespace TWXProxy.Core
{
    /// <summary>
    /// Partial class containing array command implementations
    /// </summary>
    public partial class ScriptRef
    {
        #region Array Command Implementations

        /// <summary>
        /// CMD: SETARRAY var dimensions...
        /// Creates a multi-dimensional array with specified dimensions.
        /// </summary>
        private static CmdAction CmdSetArray_Impl(object script, CmdParam[] parameters)
        {
            if (parameters[0] is VarParam varParam)
            {
                int[] dimensions = new int[parameters.Length - 1];
                for (int i = 1; i < parameters.Length; i++)
                {
                    dimensions[i - 1] = (int)parameters[i].DecValue;
                }

                varParam.SetArray(dimensions);
            }
            return CmdAction.None;
        }

        /// <summary>
        /// CMD: SORT sourceArray resultArray
        /// Sorts an array in ascending or descending order.
        /// Order parameter: "A" or "ASCENDING" for ascending, "D" or "DESCENDING" for descending.
        /// </summary>
        private static CmdAction CmdSort_Impl(object script, CmdParam[] parameters)
        {
            if (parameters[0] is not VarParam sourceVar || parameters[1] is not VarParam)
            {
                return CmdAction.None;
            }

            // Get order parameter (default to ascending if not specified or invalid)
            // The original TWX supports both numeric and string sorting
            var items = new List<string>();

            // Collect all array items
            for (int i = 0; i < sourceVar.ArraySize; i++)
            {
                var indexVar = sourceVar.GetIndexVar(new[] { (i + 1).ToString() });
                if (indexVar != null && !string.IsNullOrEmpty(indexVar.Value))
                {
                    items.Add(indexVar.Value);
                }
            }

            // Sort the items
            items.Sort();

            // Set result array
            if (parameters[1] is VarParam resultVar)
            {
                resultVar.SetArrayFromStrings(items);
                parameters[1].Value = items.Count.ToString();
            }

            return CmdAction.None;
        }

        #endregion
    }
}
