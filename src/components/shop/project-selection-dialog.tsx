import { useState, useEffect } from 'react';
import { type Project } from '@prisma/client';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';
import { Building2, MapPin, DollarSign } from 'lucide-react';
import Image from 'next/image';

interface ProjectSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  projects: Project[];
  isLoading?: boolean;
}

export function ProjectSelectionDialog({
  isOpen,
  onClose,
  onSelectProject,
  projects,
  isLoading = false,
}: ProjectSelectionDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectsInHypertrain, setProjectsInHypertrain] = useState<Set<string>>(new Set());

  // Check which projects are already in hypertrain
  useEffect(() => {
    if (isOpen && projects.length > 0) {
      const checkProjects = async () => {
        const hypertrainChecks = await Promise.all(
          projects.map(async (project) => {
            try {
              const response = await fetch(`/api/trpc/hypertrain.getHyperTrainItemByExternalId?input=${encodeURIComponent(JSON.stringify(project.id))}`);
              const data = await response.json();
              return { projectId: project.id, isInHypertrain: !!data.result?.data };
            } catch {
              return { projectId: project.id, isInHypertrain: false };
            }
          })
        );

        const inHypertrain = new Set(
          hypertrainChecks
            .filter(check => check.isInHypertrain)
            .map(check => check.projectId)
        );
        setProjectsInHypertrain(inHypertrain);
      };

      checkProjects();
    }
  }, [isOpen, projects]);

  const availableProjects = projects.filter(project => !projectsInHypertrain.has(project.id));

  const handleConfirm = () => {
    if (selectedProjectId) {
      onSelectProject(selectedProjectId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Project for Hyper Train</DialogTitle>
          <DialogDescription>
            Choose which project you want to promote in the Hyper Train feed to increase visibility among investors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects available. Create a project first to use Hyper Train.</p>
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">All your projects are already in the Hyper Train.</p>
            </div>
          ) : (
            <>
              {availableProjects.map((project) => (
                <div
                  key={project.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedProjectId === project.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {project.logo ? (
                        <Image
                          src={project.logo}
                          alt={project.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                        <Badge variant="secondary">{project.stage}</Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {project.about || 'No description available'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {project.countryId && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>Country ID: {project.countryId}</span>
                          </div>
                        )}
                        {project.investmentGoal && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Goal: ${project.investmentGoal.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show projects already in hypertrain */}
              {projectsInHypertrain.size > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Already in Hyper Train:</h4>
                  {projects
                    .filter(project => projectsInHypertrain.has(project.id))
                    .map((project) => (
                      <div key={project.id} className="text-sm text-gray-400 py-1">
                        {project.name}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProjectId || availableProjects.length === 0}
          >
            Continue to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
