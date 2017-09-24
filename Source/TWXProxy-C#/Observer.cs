using System;
using System.ComponentModel;
using System.Diagnostics;
 // 
 // Copyright (C) 2005  Remco Mulder
 // 
 // This program is free software; you can redistribute it and/or modify
 // it under the terms of the GNU General Public License as published by
 // the Free Software Foundation; either version 2 of the License, or
 // (at your option) any later version.
 // 
 // This program is distributed in the hope that it will be useful,
 // but WITHOUT ANY WARRANTY; without even the implied warranty of
 // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 // GNU General Public License for more details.
 // 
 // You should have received a copy of the GNU General Public License
 // along with this program; if not, write to the Free Software
 // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 // 
 // For source notes please refer to Notes.txt
 // For license terms please refer to GPL.txt.
 // 
 // These files should be stored in the root of the compression you
 // received this source in.
namespace Observer
{
    public interface IObserver
    {
        void Notify(TNotificationType NoteType);
    } // end IObserver

    public interface ISubject
    {
        void NotifyObservers(TNotificationType NoteType);
        void RegisterObserver(IObserver Observer, bool OneNotifyOnly);
        void UnregisterObserver(IObserver Observer);
    } // end ISubject

    public class TObservation
    {
        public IObserver Observer
        {
          get {
            return FObserver;
          }
          set {
            FObserver = value;
          }
        }
        public bool OneNotifyOnly
        {
          get {
            return FOneNotifyOnly;
          }
          set {
            FOneNotifyOnly = value;
          }
        }
        private IObserver FObserver = null;
        private bool FOneNotifyOnly = false;
    } // end TObservation

    public class TSubject: Component, ISubject
    {
        private TObservation[] FObservations;
        // ISubject
        protected void NotifyObservers(TNotificationType NoteType)
        {
            int I;
            TObservation Observation;
            IObserver Observer;
            I = 0;
            while ((I < FObservations.Length))
            {
                Observation = FObservations[I];
                //@ Unsupported property or method(C): 'Observer'
                Observer = Observation.Observer;
                if ((Observation.OneNotifyOnly))
                {
                    // could perhaps be optimised ..
                    UnregisterObserver(Observer);
                }
                else
                {
                    I ++;
                }
                Observer.Notify(NoteType);
            }
        }

        protected void RegisterObserver(IObserver Observer, bool OneNotifyOnly)
        {
            int Index;
            TObservation Observation;
            Index = FObservations.Length;
            FObservations = new TObservation[Index + 1];
            Observation = new TObservation();
            Observation.OneNotifyOnly = OneNotifyOnly;
            //@ Unsupported property or method(C): 'Observer'
            Observation.Observer = Observer;
            FObservations[Index] = Observation;
        }

        protected void RegisterObserver(IObserver Observer)
        {
            RegisterObserver(Observer, false);
        }

        protected void UnregisterObserver(IObserver Observer)
        {
            int Index;
            Index = GetObserverIndex(Observer);
            //@ Unsupported property or method(C): 'Free'
            FObservations[Index].Free;
            Index ++;
            if ((Index > 0))
            {
                // move the whole lot down
                while ((Index < FObservations.Length))
                {
                    FObservations[Index - 1] = FObservations[Index];
                }
                FObservations = new TObservation[Index - 1];
            }
        }

        private int GetObserverIndex(IObserver Observer)
        {
            int result;
            int I;
            result =  -1;
            for (I = 0; I < FObservations.Length; I ++ )
            {
                //@ Unsupported property or method(C): 'Observer'
                if ((FObservations[I].Observer == Observer))
                {
                    result = I;
                }
            }
            Debug.Assert(result >= 0, "Observer not found");
            return result;
        }

    } // end TSubject

    // Implements Observer pattern.
    public enum TNotificationType
    {
        ntAuthenticationDone,
        ntAuthenticationFailed
    } // end TNotificationType

}

