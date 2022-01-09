import {
  evaluate
} from "./common.js";
import {
  resetRepl
} from "./repl.js";

const initValue =
`;; Source code at https://github.com/ZibingZhang/racket-online-ide
;; Use \`Alt-Enter' to run the code

;; The following is a submission for assignment 9 from the spring 2019 semester.

; EXERCISE 1 -----------------------------------------------------------------------------------------

(define-struct plist [frst rst])
; A PseudoLON is one of :
; - "empty"
; - (make-plist Number PseudoLON)
; and represents a list of numbers
(define PLON1 "empty")
(define PLON2 (make-plist 13
                          "empty"))
(define PLON3 (make-plist 8/2
                          PLON2))
(define PLON4 (make-plist 5.5
                          PLON3))
(define PLON5 (make-plist -3
                          PLON4))
(define PLON6 (make-plist 0
                          PLON5))
(define (plon-template plon)
  (cond
    [(string? plon)
     (... plon ... )]
    [(plist? plon)
     (... (plist-frst plon) ...
          ... (plon-template (plist-rst plon)) ...)]))

; EXERCISE 2 -----------------------------------------------------------------------------------------

; add-up-all : PseudoLON -> Number
; Adds up all the numbers
(define (add-up-all plon)
  (cond [(string? plon)
         0]
        [(plist? plon)
         (+ (plist-frst plon)
            (add-up-all (plist-rst plon)))]))
(check-expect (add-up-all PLON1) 0)
(check-expect (add-up-all PLON2) 13)
(check-expect (add-up-all PLON3) 17)
(check-expect (add-up-all PLON4) 22.5)
(check-expect (add-up-all PLON5) 19.5)
(check-expect (add-up-all PLON6) 19.5)

; EXERCISE 3 -----------------------------------------------------------------------------------------

; The function add-up-all expects a PseudoLON. The program will break because at some point a Number
; will be passed to add-up-all, which is not a PseudoLON. A Number is neither a string nor a plist, so
; none of the conditions in the cond function will be met thus throwing an error.

; The reason this occurs is because each PseudoLON is either a String or a
; (make-plist Number PseudoLON). If we examine the given PseudoLON, we can clearly see it it not
; actually a PseudoLON. The nested "rst" part of the nested make-plist is 19 which is not a
; PseudoLON. At some point when (plist-rst plon) gets passed to add-up-all it will not be a PseudoLON
; thus throwing error as explained above.

; EXERCISE 4 -----------------------------------------------------------------------------------------

; A LON is one of :
; - '()
; - (cons Number LON)
; and represents a list of numbers
(define LON1 '())
(define LON2 (cons 13  '()))
(define LON3 (cons 8/2 LON2))
(define LON4 (cons 5.5 LON3))
(define LON5 (cons -3  LON4))
(define LON6 (cons 0   LON5))
(define (lon-template lon)
  (cond
    [(empty? lon)
     (...)]
    [(cons? lon)
     (... (first lon) ...
          ... (lon-template (rest lon)) ...)]))

; EXERCISE 5 -----------------------------------------------------------------------------------------

; add-lon : LON -> Number
; Adds up all the numbers
(define (add-lon lon)
  (cond [(empty? lon)
         0]
        [(cons? lon)
         (+ (first lon)
            (add-lon (rest lon)))]))
(check-expect (add-lon LON1) 0)
(check-expect (add-lon LON2) 13)
(check-expect (add-lon LON3) 17)
(check-expect (add-lon LON4) 22.5)
(check-expect (add-lon LON5) 19.5)
(check-expect (add-lon LON6) 19.5)

; EXERCISE 6 -----------------------------------------------------------------------------------------

; The program will break because the second argument in the cons function must be a list but is
; instead a number for the nested cons function. The compiler will throw an error. Let us assume
; though that it doesn't throw an error and somehow the argument (cons 17 (cons 18 19)) is passed
; to the function. add-lon takes in a LON, but at some point a Number will be passed to LON. A Number
; is neither an empty list nor a list which means that none of the conditional statements in the cond
; function will be met therefore throwing an error.

; The first reason why this will break is because the second argument passed to the cons function is
; not a list. Assuming that the complier ignores this error, another error will occur when add-lon
; is called on the rest of (cons 18 19). 19 is not a list so it will not return true for (empty? lon)
; or (cons? lon). It will not satisfy any case in the cons statement which will throw an error.

; EXERCISE 7 -----------------------------------------------------------------------------------------

; A LOS is one of :
; - '()
; - (cons String LOS)
; and represents a list of Strings
(define LOS1   '())
(define LOS2.1 (cons "banana"  '()))
(define LOS2.2 (cons "Apricot" LOS2.1))
(define LOS2.3 (cons "apple"   LOS2.2))
(define LOS2.4 (cons "1zebra"  LOS2.3))
(define LOS3.1 (cons "apple"   '()))
(define LOS3.2 (cons "Apple"    LOS3.1))
(define LOS3.3 (cons "surprise" LOS3.2))
(define LOS4 (cons "apple" (cons "zebra" (cons "banana" '()))))
(define (los-template los)
  (cond
    [(empty? los)
     (...)]
    [(cons? los)
     (... (first los) ...
          ... (los-template (rest los)) ...)]))

; all-in-order? : LOS -> Bool
; Are all the strings in alphabetical order?
(define (all-in-order? los)
  (cond
    [(empty? los)
     #t]
    [(cons? los)
     (if (in-order? (first los) (rest los))
         (all-in-order? (rest los))
         #f)]))
(check-expect (all-in-order? LOS1)   #t)
(check-expect (all-in-order? LOS2.1) #t)
(check-expect (all-in-order? LOS2.2) #t)
(check-expect (all-in-order? LOS2.3) #t)
(check-expect (all-in-order? LOS2.4) #t)
(check-expect (all-in-order? LOS3.2) #t)
(check-expect (all-in-order? LOS3.3) #f)
(check-expect (all-in-order? LOS4)   #f)

; in-order? : String LOS -> Bool
; Is the string before the first string in the list alphabetically?
(define (in-order? s los)
  (cond
    [(empty? los)
     #t]
    [(cons? los)
     (string<=? (string-downcase s)
                (string-downcase (first los)))]))
(check-expect (in-order? ""          LOS1)   #t)
(check-expect (in-order? "anything"  LOS1)   #t)
(check-expect (in-order? "1anything" LOS1)   #t)
(check-expect (in-order? ""          LOS2.1) #t)
(check-expect (in-order? "apple"     LOS2.1) #t)
(check-expect (in-order? "1zebra"    LOS2.1) #t)
(check-expect (in-order? "zebra"     LOS2.1) #f)
(check-expect (in-order? "surprise"  LOS3.3) #t)
(check-expect (in-order? "yoyo"      LOS3.3) #f)

; EXERCISE 8 -----------------------------------------------------------------------------------------

#|
; A LOI is one of :
; - '()
; - (cons Image LOI)
; and represents a list of images
(define LOI1 '())
(define LOI2 (cons (circle 20 "solid" "blue") LOI1))
(define LOI3 (cons (rectangle 50 75 "solid" "red") LOI2))
(define LOI4 (cons (triangle 45 "solid" "pink") LOI3))

; smoosh : LOI -> Image
; Places the Images next to each other in order (so that Images that appear closer to the front of
; the list will appear further to the left)
(define (smoosh loi)
  (cond
    [(empty? loi)
     empty-image]
    [(cons? loi)
     (beside (first loi)
             (smoosh (rest loi)))]))
(check-expect (smoosh LOI1) empty-image)
(check-expect (smoosh LOI2) (circle 20 "solid" "blue"))
(check-expect (smoosh LOI3) (beside (rectangle 50 75 "solid" "red")
                                    (circle 20 "solid" "blue")))
(check-expect (smoosh LOI4) (beside (triangle 45 "solid" "pink")
                                    (beside (rectangle 50 75 "solid" "red")
                                            (circle 20 "solid" "blue"))))
|#

; EXERCISE 9 -----------------------------------------------------------------------------------------

#|
(define LON7 (cons 4 LON1))
(define LON8 (cons 9 LON7))
(define LON9 (cons 0.2 LON8))

; root-the-squares : LON -> LON
; Returns a list of square roots of all the perfect squares
(define (root-the-squares lon)
  (cond
    [(empty? lon)
     '()]
    [(cons? lon)
     (cons (cond-sqrt (first lon))
           (root-the-squares (rest lon)))]))
(check-expect (root-the-squares LON1) '())
(check-expect (root-the-squares LON7) (cons 2 LON1))
(check-expect (root-the-squares LON8) (cons 3 (cons 2 LON1)))
(check-expect (root-the-squares LON9) (cons 0.2 (cons 3 (cons 2 LON1))))

; cond-sqrt : Number -> Number
; Takes the square root only if the given argument is a perfect square
(define (cond-sqrt n)
  (if (integer? (sqrt n))
      (sqrt n)
      n))
(check-expect (cond-sqrt 0.2) 0.2)
(check-expect (cond-sqrt   0) 0)
(check-expect (cond-sqrt 8/2) 2)
(check-expect (cond-sqrt 9.0) 3)
(check-expect (cond-sqrt  -9) -9)
|#

; EXERCISE 10 ----------------------------------------------------------------------------------------

(define S0 '())
(define S1 (cons 1 (cons 2 (cons 3 '()))))
(define S2 (cons 1 (cons 1 (cons 1 (cons 1 (cons 2 (cons 2 (cons 2 (cons 3 (cons 3 '()))))))))))
(define S3 (cons 1 (cons 3 (cons 2 '()))))
(define S4 (cons 1 (cons 2 (cons 4 '()))))

; set=? : List List -> Bool
; Are the two sets equal?
(define (set=? s1 s2)
  (and (all-in? s1 s2)
       (all-in? s2 s1)))
(check-expect (set=? S0 S1) #f)
(check-expect (set=? S1 S0) #f)
(check-expect (set=? S1 S2) #t)
(check-expect (set=? S2 S1) #t)
(check-expect (set=? S1 S3) #t)
(check-expect (set=? S1 S4) #f)

; all-in? : List List -> Bool
; Are all the elements of the first list in the second?
(define (all-in? s1 s2)
  (cond
    [(empty? s1)
     #t]
    [(cons? s1)
     (if (in? (first s1) s2)
         (all-in? (rest s1) s2)
         #f)]))
(check-expect (all-in? S1 S0) #f)
(check-expect (all-in? S1 S2) #t)
(check-expect (all-in? S1 S3) #t)
(check-expect (all-in? S1 S4) #f)

; in? : Number List -> Bool
; Is the number in the list?
(define (in? n l)
  (cond
    [(empty? l)
     #f]
    [(cons? l)
     (if (= n (first l))
         #t
         (in? n (rest l)))]))
(check-expect (in? 9 S0) #f)
(check-expect (in? 1 S1) #t)
(check-expect (in? 0 S1) #f)
(check-expect (in? 3 S2) #t)
(check-expect (in? 4 S2) #f)
`;
const editorTextArea = document.getElementById("editor");
const editor = CodeMirror(
(elt) => {
  editorTextArea.parentNode.replaceChild(elt, editorTextArea);
}, {
lineNumbers: true,
tabSize: 2,
value: initValue,
mode: "racket",
theme: "monokai",
extraKeys: {
  "Alt-Enter": () => {
    resetRepl();
    evaluate(
      window.pipelines.evaluateProgram,
      editor.getValue(),
      true
    );
  }
}});
