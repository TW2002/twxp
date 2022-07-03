using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace TWXP
{
    //public enum CommandType { Internal, Operator, Public, System };

    public class Param
    {
        //// Implicit operator to cast a string to a parameter.
        //public static implicit operator Param(string s)
        //{
        //    return new Param(s);
        //}

        //// Implicit operator to cast a bool to a parameter.
        //public static implicit operator Param(bool b)
        //{
        //    return new Param(b);
        //}

        //// Implicit operator to cast a int to a parameter.
        //public static implicit operator Param(double d)
        //{
        //    return new Param(d);
        //}

        //// Implicit operator to cast a int to a parameter.
        //public static implicit operator Param(int i)
        //{
        //    return new Param(i);
        //}

        // Implicit operator to cast a parameter to a string.
        public static implicit operator string(Param p)
        {
            return p.Value;
        }

        // Implicit operator to cast a parameter to boolean.
        public static implicit operator bool(Param p)
        {
            if (p.Value.ToLower() == "true" || p.DecValue == 1)
                return true;
            else
                return false;
        }

        // Implicit operator to cast a parameter to a double.
        public static implicit operator double(Param p)
        {
            return p.DecValue;
        }

        // Explicit operator to cast a parameter to an intiger.
        public static explicit operator int(Param p)
        {
            return (int)p.DecValue;
        }


        // Public Read-only Properties
        //public string Name { get; private set; }
        public string VarName { get; private set; }
        public string Value { get; private set; }
        public double DecValue { get; private set; }
        public bool IsNumeric { get; private set; }
        public bool IsVarable { get; private set; }

        private TWS TWS;

        public Param(int value)
        {
            IsNumeric = true;
            DecValue = value;

            Value = value.ToString();
        }

        public Param(double value)
        {
            IsNumeric = true;
            DecValue = value;

            Value = value.ToString();
        }

        public Param(bool value)
        {
            IsNumeric = false;
            if (value)
            {
                Value = "True";
                DecValue = 1;
            }
            else
            {
                Value = "False";
                DecValue = 0;
            }
        }

        // This is just a var, not an actual paramater
        public Param(string varname, string value)
        {
            VarName = varname;
            IsVarable = false;

            // Do note create a var, this already is one.
            Update(value, true);
        }


        /// <summary>
        /// Creates a new Param.
        /// </summary>
        /// <param name="value">The iniial value to be asigned to the paramater.</param>
//        public Param(TWS TWS, string value, bool isVarable = false)
        public Param(TWS TWS, string value, bool isVarable = false)
        {
            // Store the TWS for use in UpdateVars.
            this.TWS = TWS;

            // Set the IsVarable flag.
            IsVarable = isVarable;

            //try
            //{
            //    // Look for any vars matching the value.
            //    var vars = TWS.Vars.Where(v => v.VarName.ToLower() == value.ToLower());

            //    if (vars.Count() > 0)
            //    {
            //        Update(vars.Single().Value, true);
            //    }
            //    else
            //    {
                    if (isVarable)
                    {

                        // Set the Variable name
                        VarName = value;
                    }
                    else
                    {
                        // Update the value
                        Update(value, true);
                    }
            //    }
            //}
            //catch { }

        }

        public void Update(string value, bool skipvar = false)
        {
            // Save the value string as a property.
            Value = value;
            IsNumeric = false;

            // Try to parse the input string as a number.
            double decValue = 0;
            if (Double.TryParse(value, out decValue))
            {
                IsNumeric = true;
                DecValue = decValue;
            }

            if (!skipvar) UpdateVar();
        }

        public void Update(double value, bool skipvar = false)
        {
            // Save the value to the properties.
            IsNumeric = true;
            Value = value.ToString();
            DecValue = value;

            if (!skipvar) UpdateVar();
        }

        public void Update(bool value, bool skipvar = false)
        {
            // Save the value to the properties.
            IsNumeric = false;
            if (value)
            {
                Value = "True";
                DecValue = 1;
            }
            else
            {
                Value = "False";
                DecValue = 0;
            }

            if (!skipvar) UpdateVar();
        }

        private void UpdateVar()
        {
            if (IsVarable)
            {
                try
                {
                    var vars = TWS.Vars.Where(v => v.VarName.ToLower() == VarName.ToLower());

                    if (vars.Count() > 0)
                    {
                        vars.Single().Update(Value);
                    }
                    else
                    {
                        TWS.Vars.Add(new Param(VarName, Value));
                    }
                }
                catch { }
            }
        }

        //public void LoadVar()
        //{
        //    IsVarable = true;

        //    try
        //    {
        //        Varable var = TWS.Vars.Where(v => v.Name.ToLower() == Value.ToLower()).Single();

        //        if (String.IsNullOrEmpty(VarName)) VarName = Value;

        //        if (var.IsNumeric)
        //            Update(var.DecValue, true);
        //        else
        //            Update(var.Value, true);

        //    }
        //    catch 
        //    {
        //        if (String.IsNullOrEmpty(VarName)) VarName = Value;
        //        TWS.Vars.Add(new Varable(VarName));
        //    }
        //}

        //public void LoadValue()
        //{
        //    try
        //    {
        //        Varable var = TWS.Vars.Where(v => v.Name.ToLower() == Value.ToLower()).Single();

        //        if (var.IsNumeric)
        //            Update(var.DecValue, true);
        //        else
        //            Update(var.Value, true);
        //    }
        //    catch { }
        //}
    }
}
