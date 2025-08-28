import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Scale, 
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Policy {
  category: string;
  title: string;
  description: string;
  implementation: string;
  compliance_level: string;
  legal_reference: string;
}

interface Recommendation {
  category: string;
  priority: string;
  title: string;
  description: string;
  implementation_timeline: string;
  expected_impact: string;
}

interface PolicyDisplayProps {
  policies: {
    policies: Policy[];
    recommendations: Recommendation[];
    compliance_checklist: string[];
    regional_context: any;
  };
}

const PolicyDisplay: React.FC<PolicyDisplayProps> = ({ policies }) => {
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getComplianceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'mandatory':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'recommended':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'optional':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Regional Policies & Compliance
          </CardTitle>
          {policies.regional_context && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{policies.regional_context.jurisdiction}</span>
              {policies.regional_context.update_frequency && (
                <Badge variant="outline" className="ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Updates: {policies.regional_context.update_frequency}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="policies" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            {/* Policies Tab */}
            <TabsContent value="policies" className="space-y-4">
              {policies.policies.map((policy, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getComplianceColor(policy.compliance_level)}>
                            {policy.compliance_level}
                          </Badge>
                          <Badge variant="outline">{policy.category}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedPolicy(
                            expandedPolicy === index ? null : index
                          )}
                        >
                          {expandedPolicy === index ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <h4 className="font-semibold text-sm">{policy.title}</h4>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {policy.description}
                      </p>
                      
                      {expandedPolicy === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-3 border-t"
                        >
                          <div>
                            <h5 className="font-medium text-xs mb-1">Implementation</h5>
                            <p className="text-xs text-muted-foreground">
                              {policy.implementation}
                            </p>
                          </div>
                          {policy.legal_reference && (
                            <div>
                              <h5 className="font-medium text-xs mb-1">Legal Reference</h5>
                              <p className="text-xs text-muted-foreground">
                                {policy.legal_reference}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {policies.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-secondary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} Priority
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRecommendation(
                            expandedRecommendation === index ? null : index
                          )}
                        >
                          {expandedRecommendation === index ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      
                      {expandedRecommendation === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-3 border-t"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <h5 className="font-medium text-xs mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Timeline
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                {rec.implementation_timeline}
                              </p>
                            </div>
                            <div>
                              <h5 className="font-medium text-xs mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Expected Impact
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                {rec.expected_impact}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <Alert>
                <Scale className="h-4 w-4" />
                <AlertDescription>
                  Review the following compliance requirements for your region:
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {policies.compliance_checklist.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-2 p-3 bg-muted/30 rounded"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>

              {policies.regional_context?.key_regulations && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-sm">Key Regulations</h4>
                  <div className="flex flex-wrap gap-2">
                    {policies.regional_context.key_regulations.map((reg: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {policies.regional_context?.enforcement_agencies && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3 text-sm">Enforcement Agencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {policies.regional_context.enforcement_agencies.map((agency: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {agency}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PolicyDisplay;