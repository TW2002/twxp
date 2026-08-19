/*
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

// Implements Observer pattern.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TWXProxy.Core
{
    public enum NotificationType
    {
        AuthenticationDone,
        AuthenticationFailed
    }

    public interface IObserver
    {
        void Notify(NotificationType noteType);
    }

    public interface ISubject
    {
        void NotifyObservers(NotificationType noteType);
        void RegisterObserver(IObserver observer, bool oneNotifyOnly = false);
        void UnregisterObserver(IObserver observer);
    }

    public class Observation
    {
        public IObserver Observer { get; set; } = null!;
        public bool OneNotifyOnly { get; set; }
    }

    public class Subject : ISubject
    {
        private List<Observation> _observations = new List<Observation>();

        public void NotifyObservers(NotificationType noteType)
        {
            int i = 0;

            while (i < _observations.Count)
            {
                var observation = _observations[i];
                var observer = observation.Observer;

                if (observation.OneNotifyOnly)
                {
                    UnregisterObserver(observer); // could perhaps be optimized
                }
                else
                {
                    i++;
                }

                observer.Notify(noteType);
            }
        }

        public void RegisterObserver(IObserver observer, bool oneNotifyOnly = false)
        {
            var observation = new Observation
            {
                OneNotifyOnly = oneNotifyOnly,
                Observer = observer
            };

            _observations.Add(observation);
        }

        public void UnregisterObserver(IObserver observer)
        {
            int index = GetObserverIndex(observer);

            if (index >= 0)
            {
                _observations.RemoveAt(index);
            }
        }

        private int GetObserverIndex(IObserver observer)
        {
            for (int i = 0; i < _observations.Count; i++)
            {
                if (_observations[i].Observer == observer)
                {
                    return i;
                }
            }

            return -1;
        }
    }
}
