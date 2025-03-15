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
    toast.promise(
      Api.tags.delete(props.tag.uuid), {
      loading: t("toast.loading"),
      success: (result) => {
        if (result.error) {
          toast.error(result.error.message);
          return;
        }

        props.onDeletion();
        return tg("toast.deleted-success");
      },
      error: t("toast.general-error")
    })
  }


  return (
    <Dialog open={true} onOpenChange={props.onClose}>
      <DialogContent className="max-w-[325px] sm:max-w-[425px]">
        <DialogHeader className='items-start'>
          <DialogTitle>{t("dialog.delete-title")} </DialogTitle>
          <DialogDescription className='w-full flex flex-col items-start gap-2'>
            {t("dialog.delete-description")}
            <span className='ml-1 text-2xl max-w-[200px] truncate' title={props.tag.name}>{props.tag.name}</span>
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

