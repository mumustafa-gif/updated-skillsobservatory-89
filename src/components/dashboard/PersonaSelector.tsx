import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Users, GraduationCap } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type PersonaType = Database['public']['Enums']['persona_type'];

interface PersonaSelectorProps {
  selectedPersona: PersonaType | null;
  onPersonaChange: (persona: PersonaType) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selectedPersona, onPersonaChange }) => {
  const currentPersona = selectedPersona || 'minister';
  const personas: Array<{
    value: PersonaType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
  }> = [
    {
      value: 'minister',
      label: 'Minister',
      icon: Crown,
      description: 'Strategic policy focus, executive briefings',
      color: 'text-primary'
    },
    {
      value: 'chro',
      label: 'CHRO',
      icon: Users,
      description: 'Human resources, workforce analytics',
      color: 'text-primary'
    },
    {
      value: 'educationist',
      label: 'Educationist',
      icon: GraduationCap,
      description: 'Learning outcomes, educational planning',
      color: 'text-accent'
    }
  ];

  const selectedPersonaData = personas.find(p => p.value === currentPersona);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Analysis Persona</Label>
          <Select value={currentPersona} onValueChange={onPersonaChange}>
            <SelectTrigger className="w-full h-12 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors">
              <SelectValue>
                {selectedPersonaData && (
                  <div className="flex items-center gap-3">
                    <selectedPersonaData.icon className={`h-5 w-5 ${selectedPersonaData.color} opacity-90`} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{selectedPersonaData.label}</div>
                      <div className="text-xs text-muted-foreground">{selectedPersonaData.description}</div>
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {personas.map((persona) => (
                <SelectItem key={persona.value} value={persona.value} className="cursor-pointer hover:bg-primary hover:text-white focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white group">
                  <div className="flex items-center gap-3 py-2 px-1 w-full">
                    <div className="flex-shrink-0">
                      <persona.icon className={`h-5 w-5 transition-colors group-hover:text-white group-data-[highlighted]:text-white ${persona.color} opacity-80 group-hover:opacity-100 group-data-[highlighted]:opacity-100`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm group-hover:text-white group-data-[highlighted]:text-white">{persona.label}</div>
                      <div className="text-xs leading-relaxed mt-0.5 group-hover:text-white/90 group-data-[highlighted]:text-white/90">{persona.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPersonaData && (
            <p className="text-xs text-muted-foreground">
              All responses will be tailored for {selectedPersonaData.label.toLowerCase()} perspective
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaSelector;