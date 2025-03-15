import { Api } from '@/api/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import type { SimpleTag } from '@/api/model/tag.interface';

/**
  * The properties for {@link DeleteTagDialog}
  */
export type DeleteTagDialogProps = {
  tag: SimpleTag,
  onDeletion: () => void;
  onClose: () => void;
};

/**
  * The DeleteTagDialog
  */
export function DeleteTagDialog(props: DeleteTagDialogProps) {
  const [t] = useTranslation("tag");
  const [tg] = useTranslation();

  const deleteTag = async () => {
    Api.tags.delete(props.tag.uuid).then((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Deleted successfully");
      props.onDeletion();
    }
    )
  }


  return (
    <Dialog open={true} onOpenChange={props.onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.delete-title")} <span className='ml-1 text-2xl'>{props.tag.name}</span></DialogTitle>
          <DialogDescription>
            {t("dialog.delete-description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className='w-full flex justify-between'>
            <Button variant="secondary" onClick={() => props.onClose()}> {tg("button.close")} </Button>
            <Button variant="destructive" onClick={async () => await deleteTag()}> {t("button.delete")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

