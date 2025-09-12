import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Users, GraduationCap } from 'lucide-react';

interface PersonaSelectorProps {
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selectedPersona, onPersonaChange }) => {
  const personas = [
    {
      value: 'minister',
      label: 'Minister',
      icon: Crown,
      description: 'Strategic policy focus, executive briefings',
      color: 'text-purple-600'
    },
    {
      value: 'chro',
      label: 'CHRO',
      icon: Users,
      description: 'Human resources, workforce analytics',
      color: 'text-blue-600'
    },
    {
      value: 'educationist',
      label: 'Educationist',
      icon: GraduationCap,
      description: 'Learning outcomes, educational planning',
      color: 'text-green-600'
    }
  ];

  const selectedPersonaData = personas.find(p => p.value === selectedPersona);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Analysis Persona</Label>
          <Select value={selectedPersona} onValueChange={onPersonaChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {selectedPersonaData && (
                  <div className="flex items-center gap-2">
                    <selectedPersonaData.icon className={`h-4 w-4 ${selectedPersonaData.color}`} />
                    <span>{selectedPersonaData.label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {personas.map((persona) => (
                <SelectItem key={persona.value} value={persona.value}>
                  <div className="flex items-center gap-3 py-1">
                    <persona.icon className={`h-4 w-4 ${persona.color}`} />
                    <div>
                      <div className="font-medium">{persona.label}</div>
                      <div className="text-xs text-muted-foreground">{persona.description}</div>
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