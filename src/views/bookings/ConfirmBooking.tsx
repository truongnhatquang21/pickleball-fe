/* eslint-disable no-underscore-dangle */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, UsersIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "path";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { postBooking } from "@/apiCallers/customerBooking";
import { addCardAPI, getCardListAPI } from "@/apiCallers/payment";
import CustomTag from "@/components/CustomTag";
import { Icons } from "@/components/icons";
import { Loading } from "@/components/loading";
import SpinnerIcon from "@/components/SpinnerIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AutoForm, { AutoFormSubmit } from "@/components/ui/auto-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { IBooking } from "@/interfaces/booking.interface";
import type { ISchedule } from "@/interfaces/schedule.interface";
import cardimg from "@/public/assets/images/cardbank.png";
import vnpay from "@/public/assets/images/vnpay.png";
import { useBookingStore } from "@/stores/bookingStore";
// type Props = {
//   branchId: String;
// };
const cardSchema = z.object({
  accountNumber: z.string().min(16).max(16),
  accountName: z.string(),
  accountBank: z.string(),
  expDate: z.coerce.date(),
});

const bookingTransactionSchema = z.object({
  amount: z.number(),
  payment: z
    .string({
      required_error: "Please select a payment method",
    })
    .min(1, "Please select a payment method"),
  // packageId: z.string(),
});
export type OrderSchemaType = z.infer<typeof bookingTransactionSchema>;
export type CardSchemaType = z.infer<typeof cardSchema>;
const ConfirmBooking = () => {
  const [paymentType, setPaymentType] = useState("partial");
  const [open, setOpen] = useState(false);

  const [payment, setPayment] = useState<"bank" | "tranfer">("bank");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const router = useRouter();
  const { toast } = useToast();
  const { data: cardList, isLoading: isCardListLoading } = useQuery({
    queryKey: ["cardList"],
    queryFn: async () => getCardListAPI(),
  });
  const { mutateAsync: triggerAddCard, isPending } = useMutation({
    mutationFn: async (data: CardSchemaType) => {
      return addCardAPI(data);
    },
    onSuccess: (data) => {
      console.log(data);

      if (data.ok && !data.ok) {
        // if (data.error) {
        //   const errs = data.error as { [key: string]: { message: string } };
        //   Object.entries(errs).forEach(([key, value]) => {
        //     setError(key as keyof PackageCourtSchemaType, {
        //       type: "manual",
        //       message: value.message,
        //     });
        //   });
        // }
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: data.message || data.statusText,
        });
        throw new Error(data.message || data.statusText);
      }
      if (data.message) {
        return toast({
          variant: "default",
          className: "bg-green-600 text-white",
          title: "Message from system",
          description: data.message,
        });
      }
      return toast({
        variant: "default",
        title: "Submitted successfully",
        description: "You can do something else now",
      });
    },
  });
  const onAddCardSubmit = async (value: CardSchemaType) => {
    try {
      await triggerAddCard(value);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["cardList"],
      });
    } catch (error) {
      console.log(error);
    }
  };

  const { bookingData } = useBookingStore((state) => {
    return {
      bookingData: state.bookingData,
    };
  });
  const {
    trigger,
    setValue,
    getValues,

    formState: { isLoading: isBookingSubmit, errors },
  } = useForm<OrderSchemaType>({
    resolver: zodResolver(bookingTransactionSchema),
    defaultValues: {
      amount: 0,
      payment: "",
      // packageId: subsId,
    },
  });
  const { mutateAsync: bookingMutation, isPending: bookingMutating } =
    useMutation({
      mutationFn: async (bookingReq: {
        booking: Omit<IBooking, "status">;
        schedule: Omit<ISchedule, "status">;
        transaction: { amount: number; payment: string };
      }) => postBooking(bookingReq),
      onSuccess: (data) => {
        console.log(data);

        if (!data.ok) {
          if (data.error) {
            // const errs = data.error as { [key: string]: { message: string } };
            // Object.entries(errs).forEach(([key, value]) => {
            //   setError(key as keyof PackageCourtSchemaType, {
            //     type: "manual",
            //     message: value.message,
            //   });
            // });
            console.log(data.error);
          }
          router.push("/");

          return toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: data.message || data.statusText,
          });
        }

        if (data.message) {
          // router.push("/me/schedule");
          // return toast({
          //   variant: "default",
          //   className: "bg-green-600 text-white",
          //   title: "Message from system",
          //   description: data.message,
          // });
          setOpen(true);
        }

        // return toast({
        //   variant: "default",
        //   title: "Submitted successfully",
        //   description: "You can do something else now",
        // });
      },
    });
  const handleBooking = async () => {
    const paymentId = getValues("payment");
    if (!paymentId) {
      return toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please choose Payment Method",
      });
    }
    if (bookingData.booking && bookingData.schedule && paymentId) {
      console.log({
        booking: {
          type: bookingData.booking.type,
          paymentType,
          payment,
          totalPrice: bookingData.booking.totalPrice,
          totalHour: bookingData.booking.totalHour,
          startDate: bookingData.booking.startDate,
          endDate: bookingData.booking.endDate,
          court: bookingData.booking.court._id,
        },
        schedule: {
          type: bookingData.schedule.type,
          slots: bookingData.schedule.slots,
          startTime: bookingData.schedule?.startTime,
          endTime: bookingData.schedule?.endTime,
          date: bookingData.schedule?.date,
          court: bookingData.schedule.court._id,
        },

        transaction: {
          amount: bookingData.booking.totalPrice,
          payment: getValues("payment"),
        },
      });

      await bookingMutation({
        booking: {
          type: bookingData.booking.type,
          paymentType,
          paymentMethod: payment,
          totalPrice: bookingData.booking.totalPrice,
          totalHour: bookingData.booking.totalHour,
          startDate: bookingData.booking.startDate,
          endDate: bookingData.booking.endDate,
          court: bookingData.booking.court._id,
        },
        schedule: {
          type: bookingData.schedule.type,
          slots: bookingData.schedule.slots,
          startTime: bookingData.schedule?.startTime,
          endTime: bookingData.schedule?.endTime,
          date: bookingData.schedule?.date,
          court: bookingData.schedule.court._id,
        },

        transaction: {
          amount:
            paymentType === "full"
              ? bookingData.booking.totalPrice
              : bookingData.booking.totalPrice / 2,
          payment: getValues("payment"),
        },
      });
    }
  };

  useEffect(() => {
    if (!bookingData.booking) {
      router.back();
    }
  }, [bookingData.booking, router]);
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Confirm Booking</h1>
        <p className="text-lg text-muted-foreground">
          Review your badminton court booking details.
        </p>
      </div>
      <Card className="rounded-lg shadow-lg">
        <CardHeader className="rounded-t-lg bg-primary px-6 py-4 text-primary-foreground">
          <CardTitle className="text-center text-2xl font-semibold">
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="start-date" className="text-lg font-medium">
                Start Date
              </Label>
              <div id="start-date" className="mt-2 text-sm font-medium">
                {bookingData.booking?.startDate}
              </div>
            </div>
            <div>
              <Label htmlFor="end-date" className="text-lg font-medium">
                End Date
              </Label>
              <div id="end-date" className="mt-2 text-sm font-medium">
                {bookingData.booking?.endDate}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="start-time" className="text-lg font-medium">
                Start Time
              </Label>
              <div id="start-time" className="mt-2 text-sm font-medium">
                {bookingData.schedule?.startTime}
              </div>
            </div>
            <div>
              <Label htmlFor="end-time" className="text-lg font-medium">
                End Time
              </Label>
              <div id="start-time" className="mt-2 text-sm font-medium">
                {bookingData.schedule?.endTime}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="court" className="text-lg font-medium">
              Court
            </Label>
            <Card
              key={bookingData.booking?.court._id}
              className={`
   
                 cursor-pointer
              hover:bg-muted`}
            >
              <CardContent className="grid gap-4 overflow-hidden p-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`cursor-pointer rounded-lg border-white object-cover 
                       p-2 text-white 
                    `}
                  >
                    <Icons.BadmintonCourt className="rounded-lg object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {bookingData.booking?.court.name}
                    </h3>
                    <span
                      className={`text-sm 
                       text-gray-500 dark:text-gray-400
                  `}
                    >
                      {bookingData.booking?.court.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CustomTag status={bookingData.booking?.court.status} />
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm 
                        text-gray-500 dark:text-gray-400
                    `}
                  >
                    <UsersIcon className="size-4" />
                    <span>type: {bookingData.booking?.court.type}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 text-sm 
                    text-gray-500 dark:text-gray-400
                    `}
                  >
                    {/* <DollarSignIcon className="size-4" /> */}
                    <span>
                      {" "}
                      {(bookingData?.booking?.court.price / 100).toFixed(2)}
                      VND/slot
                    </span>
                  </div>
                  {/* <Button variant="outline" size="sm">
                        Book Now
                      </Button> */}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="total-price" className="text-lg font-medium">
                Total Price
              </Label>
              <div id="total-price" className="mt-2 text-2xl font-bold">
                {(bookingData?.booking?.totalPrice / 100).toFixed(2)}
                VND
              </div>
            </div>
            <div>
              <Label htmlFor="total-hours" className="text-lg font-medium">
                Total Hours
              </Label>
              <div id="total-hours" className="mt-2 text-2xl font-bold">
                {bookingData.booking?.totalHour}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Label htmlFor="total-hours" className="text-lg font-medium">
              Payment Type
            </Label>
            <Select
              value={paymentType}
              onValueChange={(value) => {
                setPaymentType(value as "partial" | "full");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Payment method</SelectLabel>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="full" disabled>
                    Full
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-2 rounded-md border-2 border-dashed p-2">
            <span className="flex items-center  justify-between border-b py-2 font-semibold">
              Payment method
              {payment === "bank" && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="flex items-center gap-1"
                      variant="secondary"
                    >
                      <Plus />
                      Add new card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="flex max-h-[50%] flex-col overflow-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Add new card</DialogTitle>
                      <DialogDescription>
                        Fill out the form below to add a new court
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative flex-1 gap-4 overflow-auto p-2">
                      <AutoForm
                        formSchema={cardSchema}
                        onSubmit={onAddCardSubmit}
                      >
                        <AutoFormSubmit className="w-full">
                          <DialogFooter className="w-full">
                            <Button
                              className="w-full"
                              type="submit"
                              disabled={isPending}
                            >
                              {isPending ? <SpinnerIcon /> : "Save"}
                            </Button>
                          </DialogFooter>
                        </AutoFormSubmit>
                      </AutoForm>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Select
                value={payment}
                onValueChange={(value) => {
                  setPayment(value as "bank" | "tranfer");
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Payment method</SelectLabel>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="tranfer" disabled>
                      Tranfer money
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </span>

            {payment === "bank" ? (
              <div className="flex max-h-[600px] w-full flex-col gap-2 overflow-auto p-2">
                {isCardListLoading ? (
                  <div className="flex size-full justify-center p-2">
                    <Loading />
                  </div>
                ) : cardList?.data?.length ? (
                  <RadioGroup
                    onValueChange={(value) => {
                      setValue("payment", value);
                    }}
                  >
                    {cardList?.data.map((card) => (
                      <div
                        className="flex items-center space-x-2"
                        key={card._id}
                      >
                        <RadioGroupItem value={card._id} id={card._id} />
                        <Label
                          htmlFor={card._id}
                          className="flex w-full items-center gap-2"
                        >
                          <div className="flex w-full items-center gap-2  rounded-md border-2 p-2">
                            <Image
                              src={cardimg}
                              alt="img"
                              className="size-20 rounded-md border object-contain p-1 shadow-md"
                            />
                            <div className="flex flex-col">
                              <span className="text-xl font-bold">
                                {card.accountBank}
                              </span>
                              <span className="text-base font-semibold">
                                {card.accountName}
                              </span>
                              <span className="text-sm">
                                {card.accountNumber.slice(0, 4)} **** ****{" "}
                              </span>
                              <span className="text-sm">
                                {format(new Date(card.expDate), "MM/yyyy")}
                              </span>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Eye className="ml-auto cursor-pointer" />
                              </DialogTrigger>
                              <DialogContent className="flex max-h-[50%] flex-col overflow-auto sm:max-w-xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    <span>{card.accountBank}</span>
                                    <span className="text-sm font-normal">
                                      / {card.accountNumber}
                                    </span>
                                    <span />
                                  </DialogTitle>
                                  <DialogDescription>
                                    View card details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="relative flex-1 gap-4 overflow-auto p-2">
                                  <AutoForm
                                    formSchema={cardSchema}
                                    values={{
                                      accountNumber: card.accountNumber,
                                      accountName: card.accountName,
                                      accountBank: card.accountBank,
                                      expDate: card.expDate,
                                    }}
                                    fieldConfig={{
                                      accountNumber: {
                                        inputProps: {
                                          readOnly: true,
                                          placeholder: "--",
                                        },
                                      },
                                      accountName: {
                                        inputProps: {
                                          readOnly: true,
                                          placeholder: "--",
                                        },
                                      },
                                      accountBank: {
                                        inputProps: {
                                          readOnly: true,
                                          placeholder: "--",
                                        },
                                      },
                                      expDate: {
                                        inputProps: {
                                          readOnly: true,
                                          placeholder: "--",
                                        },
                                      },
                                    }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </Label>
                      </div>
                    ))}

                    {/* <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-one" id="option-one" />
                      <Label
                        htmlFor="option-one"
                        className="flex w-full items-center gap-2"
                      >
                        <div className="flex w-full items-center gap-2  rounded-md border-2 p-2">
                          <Image
                            src={cardimg}
                            alt="img"
                            className="size-20 rounded-md border object-contain p-1 shadow-md"
                          />
                          <div className="flex flex-col">
                            <span className="text-xl font-semibold">
                              VCB - Vietcombank
                            </span>
                            <span className="text-sm">Trương Nhật Quang</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Eye className="ml-auto cursor-pointer" />
                            </DialogTrigger>
                            <DialogContent className="flex max-h-[50%] flex-col overflow-auto sm:max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Add new card</DialogTitle>
                                <DialogDescription>
                                  Fill out the form below to add a new court
                                </DialogDescription>
                              </DialogHeader>
                              <div className="relative flex-1 gap-4 overflow-auto p-2">
                                <AutoForm formSchema={cardSchema} />
                              </div>
                              <DialogFooter className="w-full">
                                <Button className="w-full" type="submit">
                                  Save changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </Label>
                    </div> */}
                  </RadioGroup>
                ) : (
                  <div className="flex w-full justify-center text-sm">
                    No card found
                  </div>
                )}
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <RadioGroup defaultValue="option-one">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-two" id="option-two" />
                    <Label
                      htmlFor="option-two"
                      className="flex w-full items-center gap-2"
                    >
                      <div className="flex w-full items-center gap-2  rounded-md border-2 p-2">
                        <Image
                          src={vnpay}
                          alt="img"
                          className="size-20 rounded-md border object-contain p-1 shadow-md"
                        />
                        <div className="flex flex-col">
                          <span className="text-xl font-semibold">VNPay</span>
                          <span className="text-sm">Bookminton</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-one" id="option-one" />
                    <Label
                      htmlFor="option-one"
                      className="flex w-full items-center gap-2"
                    >
                      <div className="flex w-full items-center gap-2  rounded-md border-2 p-2">
                        <Image
                          src={vnpay}
                          alt="img"
                          className="size-20 rounded-md border object-contain p-1 shadow-md"
                        />
                        <div className="flex flex-col">
                          <span className="text-xl font-semibold">VNpay</span>
                          <span className="text-sm">Bookminton</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="rounded-b-lg bg-primary px-6 py-4 text-primary-foreground">
          <Button
            onClick={handleBooking}
            className="w-full rounded-md bg-primary-foreground px-4 py-2 font-medium text-primary shadow-sm transition-colors hover:bg-slate-300"
          >
            {bookingMutating && <SpinnerIcon />}
            Confirm Booking
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Booking Successfully You can go to the schedule to view more.
            </AlertDialogTitle>
            <AlertDialogDescription>hello</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                router.push("/me/schedule");
              }}
            >
              Go To Schedule
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                router.push("/");
              }}
            >
              Go Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfirmBooking;