import { Link, useLocation } from "react-router"
import { Button } from "../ui/button"
import { useEffect } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function BottomNavigationBar({ children }: React.PropsWithChildren) {

  return (
    <div className="fixed bottom-0 z-50 w-full h-22 bg-background/80 backdrop-blur-3xl flex items-center justify-around">
      {children}
    </div>
  )
}

export interface BottomNavigationItemProps {
  label: string;
  location: string;
}

export function BottomNavigationItem(props: BottomNavigationItemProps) {
  const location = useLocation();
  const [isActive, setIsActive] = useState(location.pathname === props.location);

  useEffect(() => {
    setIsActive(location.pathname === props.location);
  }, [location.pathname, props.location]);

  return (
    <div className="relative">
      <Link to={props.location}>
        <Button
          variant="ghost"
          className={cn("text-xl", isActive && "text-primary")}
        >
          {props.label}
        </Button>
      </Link>

      {isActive && (
        <div className="absolute left-1/2 transform -translate-x-1/2 rounded-full -bottom-2 w-1/2 h-1 bg-primary"></div>
      )}
    </div>
  )
}
