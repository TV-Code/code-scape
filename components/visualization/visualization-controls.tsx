"use client";

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { updateVisualizationSettings } from '@/lib/redux/features/codebaseSlice';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  Eye,
  EyeOff,
  GitGraph,
  AlertTriangle,
  BarChart2,
  LayoutGrid
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function VisualizationControls() {
  const dispatch = useDispatch();
  const settings = useSelector(
    (state: RootState) => state.codebase.visualizationSettings
  );

  const layouts = [
    { value: 'radial', label: 'Radial', icon: LayoutGrid },
    { value: 'tree', label: 'Tree', icon: GitGraph },
    { value: 'force', label: 'Force', icon: LayoutGrid }
  ];

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur p-4 rounded-lg border shadow-lg">
      <div className="flex items-center space-x-4">
        {/* Layout selection */}
        <div className="flex items-center space-x-2">
          {layouts.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={settings.layout === value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                dispatch(updateVisualizationSettings({ layout: value as any }))
              }
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center space-x-2 border-l pl-4">
          <Toggle
            pressed={settings.showDependencies}
            onPressedChange={(pressed) =>
              dispatch(updateVisualizationSettings({ showDependencies: pressed }))
            }
            size="sm"
            aria-label="Toggle dependencies"
          >
            <GitGraph className="w-4 h-4" />
          </Toggle>
          
          <Toggle
            pressed={settings.showIssues}
            onPressedChange={(pressed) =>
              dispatch(updateVisualizationSettings({ showIssues: pressed }))
            }
            size="sm"
            aria-label="Toggle issues"
          >
            <AlertTriangle className="w-4 h-4" />
          </Toggle>
          
          <Toggle
            pressed={settings.showMetrics}
            onPressedChange={(pressed) =>
              dispatch(updateVisualizationSettings({ showMetrics: pressed }))
            }
            size="sm"
            aria-label="Toggle metrics"
          >
            <BarChart2 className="w-4 h-4" />
          </Toggle>
        </div>

        {/* Zoom control */}
        <div className="flex items-center space-x-2 border-l pl-4">
          <span className="text-sm">Zoom</span>
          <Slider
            value={[settings.zoom]}
            min={5}
            max={50}
            step={1}
            className="w-32"
            onValueChange={([value]) =>
              dispatch(updateVisualizationSettings({ zoom: value }))
            }
          />
        </div>
      </div>
    </div>
  );
}