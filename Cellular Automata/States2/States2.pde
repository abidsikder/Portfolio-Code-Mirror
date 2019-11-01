class CA
{
  int[] cells;
  int[] ruleset;
  int w = 10;
  int generation = 0;
  String name;

  CA(int newRuleset)
  {
    cells = new int[width/w];
    ruleset = new int[8];
    this.name = Integer.toBinaryString(newRuleset);
    for (int i = 0; i < name.length(); i++)
    {
      String subsetRule = name.substring(i, i+1);
      ruleset[i] = Integer.parseInt(subsetRule);
    }

    for (int i = 0; i < cells.length; i++)
    {
      // randomize the first generation
      cells[i] =  random(1)>0.5? 0:1;
    }
  }

  void generate()
  {
    int[] nextgen = new int[cells.length];
    for (int i = 1; i < cells.length-1; i++)
    {
      int left   = cells[i-1];
      int middle = cells[i];
      int right  = cells[i+1];
      nextgen[i] = rules(left, middle, right);
    }
    cells = nextgen;
    generation++;
  }

  void display()
  {
    for (int i = 0; i < cells.length; i++) {
      if (cells[i] == 1) fill(0);
      else               fill(200);
      // Set the y-location according to the generation.
      rect(i*w, generation*w, w, w);
    }
  }

  int rules(int a, int b, int c) 
  {
    String s = "" + a + b + c;
    int index = Integer.parseInt(s, 2);
    return ruleset[index];
  }
}

CA auto;
int yCounter = 0;
int ruleCounter = 0;

void setup()
{
  size(1500, 1000);
  auto = new CA(ruleCounter);
}



void draw()
{
  auto.display();
  auto.generate();
  auto.display();
  yCounter += auto.w;

  // when it reaches the bottom of the window, save the full image
  if (yCounter > height)
  {
    String unpaddedName = auto.name;
    String paddedName = "00000000".substring(unpaddedName.length()) + unpaddedName;
    save("elementaryCA_" + paddedName + ".png");

    ruleCounter++;
    auto = new CA(ruleCounter);
    yCounter = 0;
    println(auto.name);
  }
}
